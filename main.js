import { app, BrowserWindow } from 'electron';
import agk from 'electron-updater';
const { autoUpdater } = agk;
import path from 'path';
import { fileURLToPath } from 'url';

import { createDatabase } from './db.js';
import { createServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let server;
let db;

function checkForUpdates() {
    if (!app.isPackaged) {
        console.log('Auto update disabled in development');
        return;
    }

    console.log('Checking for updates...');

    autoUpdater.on('checking-for-update', () => {
        console.log('CHECKING FOR UPDATE');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('UPDATE AVAILABLE:', info.version);
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('NO UPDATE AVAILABLE:', info.version);
    });

    autoUpdater.on('download-progress', (progress) => {
        console.log(`DOWNLOAD: ${progress.percent.toFixed(1)}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('UPDATE DOWNLOADED:', info.version);
    });

    autoUpdater.on('error', (error) => {
        console.error('UPDATE ERROR:', error);
    });

    autoUpdater.checkForUpdates();
}

function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1280,
        height: 800,

        minWidth: 900,
        minHeight: 600,

        fullscreen: true,

        icon: path.join(__dirname, 'icon.ico'),

        title: 'Gym Admin Studio',

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadURL(
        'http://127.0.0.1:4500'
    );

    mainWindow.webContents.on(
        'before-input-event',
        (event, input) => {

            if (
                input.type === 'keyDown' &&
                input.key === 'Escape'
            ) {

                event.preventDefault();

                mainWindow.setFullScreen(false);

                mainWindow.setSize(
                    1280,
                    800
                );

                mainWindow.center();
            }
        }
    );

    mainWindow.on('closed', () => {

        mainWindow = null;

    });
}


app.whenReady().then(() => {

    console.log('==============================');
    console.log('Starting Gym Admin');
    console.log('==============================');


    // DATABASE

    const databasePath = app.isPackaged
        ? path.join(
            app.getPath('userData'),
            'database.db'
        )
        : path.join(
            __dirname,
            'database.db'
        );

    console.log(
        'Database:',
        databasePath
    );


    // CREATE DATABASE

    try {

        db = createDatabase(databasePath);

        console.log(
            'SQLite database ready'
        );

    } catch (error) {

        console.error(
            'DATABASE ERROR:',
            error
        );

        app.quit();

        return;
    }


    // CREATE EXPRESS

    try {

        server = createServer(db);

        console.log(
            'Express server created'
        );

    } catch (error) {

        console.error(
            'EXPRESS ERROR:',
            error
        );

        db.close();

        app.quit();

        return;
    }


    // START EXPRESS

server = createServer(db);

server.listen(
    4500,
    '127.0.0.1',
    () => {
        console.log('Server running at http://127.0.0.1:4500');
        createWindow();
        // Check for updates
        checkForUpdates();
    }
);


app.on('window-all-closed', () => {

    if (server) {

        server = null;
    }

    if (db) {

        db.close();

        db = null;
    }

    if (process.platform !== 'darwin') {

        app.quit();

    }

});


app.on('before-quit', () => {

    if (server) {

        server.close();

        server = null;
    }

    if (db) {

        db.close();

        db = null;
    }

});
});