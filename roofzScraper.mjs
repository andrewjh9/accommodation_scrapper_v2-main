
import puppeteer from'puppeteer';
import fs from 'fs';
const fsPromises = fs.promises;
import {delay} from './helper.mjs';

const ROOFZPROPERTIESJSONPATH = "roofzProperties.json";
const ROOFPROPERTIESURL = 'https://www.roofz.eu/availability';
const CITYFILTER = "Amsterdam";
var global = this;
// Roofz Scraper checks if roofz has a new listing
/*
 1) Open Roofz avalability page 
 2) Open each listing 
 3) Check in Amsterdam
 3) Get date posted and address 
 4) Check if date posted and address pair are already seen
 5) If not in already seen:
    5a) React to the post   
        - Fill in name first name and surname
        - Fill in email 
        - Fill in phone
        - Fill in brief introduction
        - Send! 
    5b) Store date posted and address pair in file 
*/

export default async function roofzScrapper(headless){
    const browser = await puppeteer.launch({headless: headless});
	let page = await browser.newPage();
    let reactedToProperties = await getReactedToProperties();
    let propertyLinks = await getPropertyLinks(page);
    let currentListings = await getListings(page, propertyLinks);
    let newProperties = await getCheckCurrentListingNew(reactedToProperties, currentListings);
    await browser.close();
    return newProperties;
};

async function getCheckCurrentListingNew(reactedToProperties, currentListings){
    let newProperties = [];
    for(let currentListing of currentListings){
        if(!reactedToProperties.some(e => e.key === currentListing.key)){
            console.log("New Property found: "+ currentListing.address);
            reactedToProperties.push(currentListing);
            newProperties.push(currentListing);
        } else{
            console.log("Already seen Property: "+ currentListing.address);
        }

    }
    await fsPromises.writeFile(ROOFZPROPERTIESJSONPATH, JSON.stringify(reactedToProperties), 'utf8');
    return newProperties;
}

async function getListings(page, listingLinks){
    let listings = [];
    for (const listingLink of listingLinks) {
        await page.goto(ROOFPROPERTIESURL+`/${listingLink}`);
        let listing = await getListing(page, listingLink);
        if(listing.fullAddress.toLowerCase().includes(CITYFILTER.toLowerCase())){
            listings.push(listing);
        }
        await delay(4000);
    }
    return listings;
}

async function getListing(page, listingLink){
    return await page.evaluate((ROOFPROPERTIESURL, listingLink) =>{
        if(document.querySelectorAll('.project-summary')[0]){
            let publishDate = document.querySelectorAll('.project-summary')[0].innerText.split('Publish date ')[1];
            let fullAddress = document.querySelectorAll('.header__text-location')[0].innerText;
            let url = `${ROOFPROPERTIESURL}/${listingLink}`;
            let address = listingLink;
            return  {
                key: address+"%"+publishDate,
                address: address,
                fullAddress: fullAddress,
                url: url,
                publishDate: publishDate
            };
        } else { return {}}

    }, ROOFPROPERTIESURL, listingLink);
}


async function getPropertyLinks(page){
    await page.goto(ROOFPROPERTIESURL, {waitUntil: "networkidle2" });    
    return await page.evaluate(() =>{
        let propertyCards = document.querySelectorAll('.property__link');
        let propertyLinks = [];
        propertyCards.forEach(element => {
            propertyLinks.push(element.getAttribute('href').replace("/availability/",""))
          });
        return propertyLinks;
    });
}

async function getReactedToProperties(){
    return JSON.parse(await fsPromises.readFile(ROOFZPROPERTIESJSONPATH, 'utf-8', (err, data) => {
        const properties = []
        if (err) {
            throw err
        }
        if(!Object.entries(data).length === 0){
            properties = JSON.parse(data.toString());
        } else { 
        }
        return properties;
    }));

}