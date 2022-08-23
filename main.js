 
import fs from 'fs';
import createCsvWriter from 'csv-writer';
import puppeteer from'puppeteer';
import {franc, francAll} from 'franc';
import csv from'csvtojson';
import kamernetScrapper from './kamernetScraper.mjs';
import roofzScraper from './roofzScraper.mjs';
import {formatText, writeToFile, sendMail} from './helper.mjs'
import schedule from'node-schedule';
import childProcess from 'child_process';
import dotenv from "dotenv";
dotenv.config()

const headless = true;
schedule.scheduleJob('30 * * * * *', async function() {
    let newKamernetPosts, newRoomzPosts, failed = [];
    try{
        newKamernetPosts = await kamernetScrapper(headless)
    
    } catch(e){
        failed.push("Kamernet");
        newKamernetPosts = [];
    }
    try { 
        newRoomzPosts = await roofzScraper(headless);
    } catch(e){
        failed.push("RoomzPost");
        newRoomzPosts = [];
    }
    await sendMail(formatText(newKamernetPosts, newRoomzPosts, failed));
});

// childProcess.exec("powershell.exe [console]::beep(500,1000)");
