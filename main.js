
import kamernetScrapper from './kamernetScraper.mjs';
import roofzScraper from './roofzScraper.mjs';
import facebookScraper from './facebookScraper.mjs';

import {formatText, writeToFile, sendMail, getDateTimeString} from './helper.mjs'
import schedule from'node-schedule';
import dotenv from "dotenv";
dotenv.config()
// 0    0/5  10-20 * * ? 
const headless = true;

job();
schedule.scheduleJob("0 0/10 10-22 * * ?", async function() {
    job();
});

async function job(){

    console.log("Job Running "+getDateTimeString());
    let newKamernetPosts, newRoomzPosts, newFacebookPosts, failed = [];
    try{
        newKamernetPosts = await kamernetScrapper(headless)
    } catch(e){
        console.log(e)
        failed.push("Kamernet "+getDateTimeString());
        newKamernetPosts = [];
    }
    try { 
        newRoomzPosts = await roofzScraper(headless);
    } catch(e){
        console.log(e)
        failed.push("RoomzPost "+getDateTimeString());
        newRoomzPosts = [];
    }
    // try {
    //     newFacebookPosts = await facebookScraper();
    // } catch(e){
    //     console.log(e)
    //     failed.push("Facebook "+getDateTimeString());
    //     newFacebookPosts = [];
    // }
    if(newKamernetPosts.length == 0 && newRoomzPosts.length == 0 && failed.length == 0){
        console.log("Nothing new found no email sent "+getDateTimeString());
    } else { 
        console.log("Sending mail");
        await sendMail(formatText(newKamernetPosts, newRoomzPosts, failed));
    }
}

// childProcess.exec("powershell.exe [console]::beep(500,1000)");
