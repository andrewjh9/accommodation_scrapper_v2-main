
import kamernetScrapper from './kamernetScraper.mjs';
import roofzScraper from './roofzScraper.mjs';
import {formatText, writeToFile, sendMail} from './helper.mjs'
import schedule from'node-schedule';
import dotenv from "dotenv";
dotenv.config()

const headless = false;
job();
schedule.scheduleJob("*/30 * * * *", async function() {
    job();
});

async function job(){
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
    if(newKamernetPosts.length == 0 && newRoomzPosts.length == 0 && failed.length == 0){
        console.log("Nothing new found new email sent");
    } else { 
        console.log("Sending mail");
        await sendMail(formatText(newKamernetPosts, newRoomzPosts, failed));
    }
}

// childProcess.exec("powershell.exe [console]::beep(500,1000)");
