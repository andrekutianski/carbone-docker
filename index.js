const path = require(`path`);
const fs = require(`fs-extra`);
const _ = require(`lodash`);
const util = require(`util`);
const carbone = require(`carbone`);
const telejson = require(`telejson`);
const express = require(`express`);
const bodyParser = require(`body-parser`);
const app = express();
const upload = require(`multer`)({ dest: `/tmp/uploads/` });
const port = process.env.CARBONE_PORT || 3030;
const basicAuth = require("express-basic-auth");
const nodemailer = require("nodemailer");

const { Storage } = require("./storage");

const username = process.env.USERNAME || undefined;
const password = process.env.PASSWORD || undefined;

if (!username || !password) {
  console.error(
    "missing authentication credentials. Please pass USERNAME and PASSWORD environment variables"
  );
  process.exit(-1);
}

function configureStorage() {
  const rootPath = process.env.STORAGE_PATH;

  if (!rootPath) {
    console.log(
      "no file storage configured; generated files will not be stored."
    );
    return undefined;
  }

  const storage = new Storage(rootPath);

  storage.validate();
  console.log(`working file storage on ${rootPath} configured`);

  return storage;
}

function configureSmtp() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT && parseInt(process.env.SMTP_PORT);

  const unsafe = process.env.SMTP_UNSAFE;

  const auth = user && pass ? { user, pass } : undefined;

  const smtp = {
    ignoreTLS: unsafe,
    auth,
    host,
    port
  };

  const config = {
    user,
    smtp
  };

  return config;
}

const config = configureSmtp();

const transport = nodemailer.createTransport(config.smtp);

const storage = configureStorage();

function auth() {
  return basicAuth({
    users: { [username]: password }
  });
}

app.use(auth());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const render = util.promisify(carbone.render);

// Flagging default formatters to remove custom ones later
_.forEach(carbone.formatters, formatter => (formatter.$isDefault = true));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(`./test.html`));
});

app.get("/files/:hash", async (req, res) => {
  if (!storage) {
    return res.sendStatus(404);
  }

  const hash = req.params.hash;
  if (!storage.isHash(hash)) {
    return res.sendStatus(404);
  }

  const filePath = storage.path(hash);
  res.setHeader("Content-Disposition", 'attachment; filename="report.pdf"');
  res.sendFile(filePath);
});

app.post("/template", upload.single(`template`), async (req, res) => {
  const template = req.file;
  
  if (!template) {
    return res.status(400).json({ error: "No template file provided" });
  }

  const fileId = req.body.fileId || template.originalname;

  if (!fileId) {
    return res.status(400).json({ error: "fileId is required" });
  }

  try {
    const templateData = await fs.readFile(template.path);
    
    await new Promise((resolve, reject) => {
      carbone.addTemplate(fileId, templateData, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await fs.remove(template.path);

    res.status(201).json({ 
      message: "Template added successfully",
      fileId: fileId
    });
  } catch (e) {
    console.error(e);
    await fs.remove(template.path).catch(() => {});
    return res.status(500).json({ error: "Failed to add template" });
  }
});

app.delete("/template/:fileId", async (req, res) => {
  const fileId = req.params.fileId;

  if (!fileId) {
    return res.status(400).json({ error: "fileId is required" });
  }

  try {
    await new Promise((resolve, reject) => {
      carbone.removeTemplate(fileId, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.status(200).json({ 
      message: "Template removed successfully",
      fileId: fileId
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to remove template" });
  }
});

app.get("/template", async (req, res) => {
  try {
    // Carbone stores templates in process.cwd() by default
    const templateDir = process.cwd();
    
    const files = await fs.readdir(templateDir);
    // Filter to show only template files (common document formats)
    const templateExtensions = ['.odt', '.ods', '.odp', '.docx', '.xlsx', '.pptx', '.txt', '.html', '.xml'];
    const templateFiles = files.filter(file => 
      !file.startsWith('.') && 
      templateExtensions.some(ext => file.endsWith(ext))
    );

    // Get detailed information for each template
    const templates = await Promise.all(
      templateFiles.map(async (filename) => {
        try {
          const filePath = path.join(templateDir, filename);
          const stats = await fs.stat(filePath);
          
          return {
            templateId: filename,
            filename: filename,
            size: stats.size,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime
          };
        } catch (err) {
          console.error(`Error getting stats for ${filename}:`, err);
          return null;
        }
      })
    );

    // Filter out any null entries from failed stat calls
    const validTemplates = templates.filter(t => t !== null);

    res.status(200).json({ 
      success: true,
      data: validTemplates,
      count: validTemplates.length
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ 
      success: false,
      error: "Failed to list templates" 
    });
  }
});

app.post("/render", upload.single(`template`), async (req, res) => {
  const template = req.file;
  const originalNameWOExt = template.originalname
    .split(`.`)
    .slice(0, -1)
    .join(`.`);
  const originalFormat = template.originalname.split(`.`).reverse()[0];
  let data = req.body.data;
  let options = {};
  let customFormatters = {};

  try {
    options = JSON.parse(req.body.options);
  } catch (e) {}

  options.convertTo = options.convertTo || originalFormat;
  options.outputName =
    options.outputName || `${originalNameWOExt}.${options.convertTo}`;
  if (typeof data !== `object` || data === null) {
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      data = {};
    }
  }

  try {
    customFormatters = telejson.parse(req.body.formatters);
  } catch (e) {}

  const defaultFormatters = {};

  // Of all formatters filter out the ones that were marked with $default
  for (const name in carbone.formatters) {
    const formatterFunc = carbone.formatters[name];
    if (formatterFunc.$isDefault) {
      defaultFormatters[name] = formatterFunc;
    }
  }

  // Replace all formatters with only the default formatters
  carbone.formatters = defaultFormatters;

  // Then add custom formatters that may have been provided inside the POST request
  carbone.addFormatters(customFormatters);

  let report = null;

  try {
    report = await render(template.path, data, options);
  } catch (e) {
    console.log(e);
    return res.status(500).send(`Internal server error`);
  }

  fs.remove(template.path);

  /* ------------------------------------------------------
  Send mail, if requested
  ------------------------------------------------------ */

  if (req.body.email) {
    try {
      const email = JSON.parse(req.body.email);
      if (!Array.isArray(email.to)) {
        throw new Error(`email.to is not an array`);
      }
      if (email.to.some(entry => typeof entry !== "string")) {
        throw new Error(`email.to contains non-string entries`);
      }
      if (!email.subject || !(typeof email.subject === "string")) {
        throw new Error(`email.subject is missing or not a string`);
      }
      if (!email.subject || !(typeof email.subject === "string")) {
        throw new Error(`email.text is missing or not a string`);
      }

      if (email.to.length > 0) {
        await transport.sendMail({
          from: config.user,
          to: email.to,
          subject: email.subject,
          text: email.text,
          attachments: [
            {
              filename: "report.pdf",
              content: report
            }
          ]
        });
      } else {
        console.info(`no email recipients given, won't send any mails`);
      }
    } catch (e) {
      console.error(`cannot send emails: ${e}`);
    }
  }

  if (storage) {
    const id = storage.store(report);
    res.setHeader("Location", `/files/${id}`);
    return res.sendStatus(301);
  }

  res.setHeader(
    `Content-Disposition`,
    `attachment; filename=${options.outputName}`
  );
  res.setHeader(`Content-Transfer-Encoding`, `binary`);
  res.setHeader(`Content-Type`, `application/octet-stream`);
  res.setHeader(`Carbone-Report-Name`, options.outputName);

  return res.send(report);
});

app.listen(port, () =>
  console.log(`Carbone wrapper listenning on port ${port}!`)
);
