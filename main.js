
import kamernetScrapper from './kamernetScraper.mjs';
import roofzScraper from './roofzScraper.mjs';
import {formatText, writeToFile, sendMail} from './helper.mjs'
import schedule from'node-schedule';
import dotenv from "dotenv";
dotenv.config()

const headless = true;
schedule.scheduleJob('* 1 * * *', async function() {
    let newKamernetPosts, newRoomzPosts, failed = [];
    try{
        newKamernetPosts = await kamernetScrapper(headless)
    
    } catch(e){
        console.log(e)
        failed.push("Kamernet");
        newKamernetPosts = [];
    }
    try { 
        newRoomzPosts = await roofzScraper(headless);
    } catch(e){
        console.log(e)
        failed.push("RoomzPost");
        newRoomzPosts = [];
    }
    if(newKamernetPosts == [] && newRoomzPosts == [] && failed == []){
    } else { 
        await sendMail(formatText(newKamernetPosts, newRoomzPosts, failed));
    }
});

// childProcess.exec("powershell.exe [console]::beep(500,1000)");
