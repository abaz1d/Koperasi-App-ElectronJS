const { app, BrowserWindow, ipcMain, screen, webContents, dialog } = require("electron");
const path = require("path");
const db = require("./config/database/db_config");
const remote = require('@electron/remote/main');
const fs = require("fs");
const url = require("url");
const md5 =require("md5");
remote.initialize();

let mainWindow;
let productWindow;
let editDataModal;
let toPdf;
let printPage;

let cashierWindow;
mainWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    minWidth: width,
    minHeight: height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  // mainWindow.loadURL('http://google.com');
  db.connect(function(err) {
    if (err){
      console.log('err', err);
    };
    console.log("Connected PostgreSQL!");
  });
}

//--------------------------------------------------------

app.whenReady().then(() => {
  mainWin();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWin();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});


//--------------------------------------------------------

ipcMain.on("load:daftarAnggota-window", (event, arg) => {
  daftarAnggotaWin();
});

// Function to create child window of parent one
daftarAnggotaWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  productWindow = new BrowserWindow({
    width: width,
    height: height,
    minHeight: 600,
    minWidth: 800,
    resizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    title: 'My Cashier App | Daftar Anggota',
  });
  remote.enable(productWindow.webContents);

  // Child window loads settings.html file
  productWindow.loadFile(path.join(__dirname, "windows/daftarAnggota.html"));
  productWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });

  productWindow.on("closed", () => {
    mainWindow.show();
  });
}

//--------------------------------------------------------

//--------------------------------------------------------

ipcMain.on("load:product-window", (event, arg) => {
  productWin();
});

// Function to create child window of parent one
productWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  productWindow = new BrowserWindow({
    width: width,
    height: height,
    minHeight: 600,
    minWidth: 800,
    resizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    title: 'My Cashier App | Data Product',
  });
  remote.enable(productWindow.webContents);

  // Child window loads settings.html file
  productWindow.loadFile(path.join(__dirname, "windows/product.html"));
  productWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });

  productWindow.on("closed", () => {
    mainWindow.show();
  });
}

//--------------------------------------------------------

ipcMain.on("load:edit", (event, msgDocId, msgForm, msgWidth, msgHeight, msgRowId) => {
  editData(msgDocId, msgForm, msgWidth, msgHeight, msgRowId);
});

editData = (docId, modalForm, modalWidth, modalHeight, rowId) => {
  let parentWin
  switch (docId) {
    case 'product-data':
      parentWin = productWindow;
      break;
  }
  editDataModal = new BrowserWindow({
    width: modalWidth,
    height: modalHeight,
    resizable: false,
    maximizable: false,
    minimizable: false,
    parent: parentWin,
    modal: true,
    title: 'Edit Data',
    frame: true,
    // autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  remote.enable(editDataModal.webContents);
  editDataModal.loadFile(`modals/edit-data.html`);
  editDataModal.webContents.on("did-finish-load", () => {
    editDataModal.webContents.send('res:form', docId, modalForm, rowId);
  });
  editDataModal.on("closed", () => {
    editDataModal = null;
  });
}
//--------------------------------------------------------

ipcMain.on('update:success', (event, msgDocId) => {
  switch (msgDocId) {
    case 'product-data':
      productWindow.webContents.send('update:success', 'Success');
      // break;
  }
  editDataModal.close();
})

ipcMain.on('close:edit', () => {
  editDataModal.close();
})

//--------------------------------------------------------

writeCsv = (path, content) => {
  fs.writeFile(path, content, (err) => {
    if (err) throw err;
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'Export CSV',
      message: 'Export CSV Success',
    });
  });
};

ipcMain.on('write:csv', (e, msgPath, msgContent ) => {
  writeCsv(msgPath, msgContent);
});

//--------------------------------------------------------

loadToPdf = (param1, param2, file_path, docId = false, title) => {
  toPdf = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  let d = new Date();
  let day = d.getDate().toString().padStart(2, 0);
  let month = (d.getMonth() + 1).toString().padStart(2, 0);
  let year = d.getFullYear();
  let today = `${day}/${month}/${year}`;

  titleObject = {
    title: title,
    date: today,
  }

  db.query(`SELECT * FROM profile ORDER BY id ASC LIMIT 1`, (err, res) => {
    if (err) throw err;
    if (res.rows.length < 1) {
        titleObject.storeName = 'My Store';
        titleObject.storeAddress = 'Address';
        titleObject.storeLogo = 'shop.png';
    } else {
        titleObject.storeName = res.rows[0].store_name;
        titleObject.storeAddress = res.rows[0].store_address;
        if (res.rows[0].store_logo == null || res.rows[0].store_logo == '') {
          titleObject.storeLogo = 'shop.png';
        } else {
          titleObject.storeLogo = res.rows[0].logo;
        }
    }
  });
  
  switch (docId) {
    case 'sales-report':
      toPdf.loadFile(path.join(__dirname, "export-pdf/sales-record-pdf.html"));
      break;
    default:
      toPdf.loadFile(path.join(__dirname, "export-pdf/toPdf.html"));
      break;
  }

  toPdf.webContents.on("dom-ready", () => {
    toPdf.webContents.send("load:table-to-pdf", param1, param2, titleObject, file_path);
  });
};

ipcMain.on('load:to-pdf', (e, msgThead, msgTbody, msgFilePath, msgDocId, msgTitle) => {
  loadToPdf(msgThead, msgTbody, msgFilePath, msgDocId, msgTitle);

});

ipcMain.on('create:pdf', (e, file_path) => {
  toPdf.webContents.printToPDF({
    landscape: true,
    marginsType: 0,
    printBackground: true,
    printSelectionOnly: false,
  }).then((data) => {
    fs.writeFile(file_path, data, (error) => {
      if (error) throw error;
      toPdf.close();
      dialog.showMessageBoxSync({
        type: "info",
        title: "Alert",
        message: "Export PDF Success",
      });
    });
  }).catch((err) => {
    console.log('error', err)
  })
});

//--------------------------------------------------------

loadPrintPage = (param1, param2, docId = false, title) => {
  printPage = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  let d = new Date();
  let day = d.getDate().toString().padStart(2, 0);
  let month = (d.getMonth() + 1).toString().padStart(2, 0);
  let year = d.getFullYear();
  let today = `${day}/${month}/${year}`;

  titleObject = {
    title: title,
    date: today,
  }

  db.query(`SELECT * FROM profile ORDER BY id ASC LIMIT 1`, (err, res) => {
    if (err) throw err;
    if (res.rows.length < 1) {
        titleObject.storeName = 'My Store';
        titleObject.storeAddress = 'Address';
        titleObject.storeLogo = 'shop.png';
    } else {
        titleObject.storeName = res.rows[0].store_name;
        titleObject.storeAddress = res.rows[0].store_address;
        if (res.rows[0].store_logo == null || res.rows[0].store_logo == '') {
          titleObject.storeLogo = 'shop.png';
        } else {
          titleObject.storeLogo = res.rows[0].logo;
        }
    }
  });
  
  switch (docId) {
    case 'sales-report':
      printPage.loadFile(path.join(__dirname, "export-pdf/sales-record-pdf.html"));
      break;
    default:
      printPage.loadFile(path.join(__dirname, "print-page.html"));
      break;
  }

  printPage.webContents.on("dom-ready", () => {
    printPage.webContents.send("load:table-to-print", param1, param2, titleObject);
  });
};

ipcMain.on('load:print-page', (e, msgThead, msgTbody, msgDocId, msgTitle) => {
  loadPrintPage(msgThead, msgTbody, msgDocId, msgTitle);
});

ipcMain.on('print:page', () => {
  printPage.webContents.print({
    printBackground: true,
  }, (success, errorType) => {
    if (!success) console.log("Print Error =>",errorType);
    printPage.close();
  })
  printPage.on('close', () => {
    printPage = null;
  });
});

//--------------------------------------------------------

cashierWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  cashierWindow = new BrowserWindow({
    width: width,
    height: height,
    minHeight: 600,
    minWidth: 800,
    resizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    title: 'My Cashier App | Cashier',
  });
  remote.enable(cashierWindow.webContents);

  cashierWindow.loadFile(path.join(__dirname, "windows/cashier.html"));

  cashierWindow.webContents.on('did-finish-load', () => {
    mainWindow.hide();
  });


  cashierWindow.on("closed", () => {
    cashierWindow = null;
    mainWindow.show();
  });
};


ipcMain.on('load:cashier-window', () => {
  cashierWin();
});

ipcMain.on('close:cashier-window', () => {
  cashierWindow.close();
});