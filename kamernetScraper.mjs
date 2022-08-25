 
import puppeteer from'puppeteer';
import {franc, francAll} from 'franc';
import {delay, getDateTimeString} from './helper.mjs';
import fs from 'fs';
const fsPromises = fs.promises;

const KAMERNETPROPERTIESFILEPATH = "kamernetProperties.json";

// import nodemailer from'nodemailer';



// Accommodation scrapper, fetches possible rooms based on keywords and send email daily.

// Features:
// - Checks for desc language
// - Shows room size 
// - Emails daily finds with information:
//     - Rating
//     - Price 
//     - Link
//     - Keywords found
//     - If posting is new



// /**
//  * Sets the search filters for the rooms
//  *
//  */
async function filterPage(page){
    /*
        Filter on price between 300 - 600,
        Filter on location 5km,
        TODO Filter on for students,
        TODO Filter on size 8m^2 or larger
        TODO Filter on on owner being a housemate !important
        Filter on rooms
    */
   console.log("Filtering "+getDateTimeString());
   await delay(400);
   page.click('#filters-selected-total-mobile');
   await delay(400);
   page.click("#roomDetails") // Open details
   await delay(400);
  //  page.click('#lbl_RoomTypeId_1'); // Filter rooms
  //  await delay(800);
  // Fail point is in here
   page.click("#suitableRoom") // Open sub menus
   await delay(400);
   let selector = 'input[id="SuitableForGendersId_1"]';
   await page.evaluate((selector) => document.querySelector(selector).click(), selector); // Filter for Man
   await delay(400);
   console.log("Gender filtered");
   await page.keyboard.type('23')
   selector = ".age-dropdown .select-dropdown";
   await page.evaluate((selector) => document.querySelector(selector).value = 23, selector); // Filter for Man
  await delay(400);
  console.log("Age filtered ");


  // page.click("#generalRoom")
  // await delay(400);
  // selector = 'input[name="OwnerTypeId"]';
  // await page.evaluate((selector) => document.querySelector(selector).click(), selector); //Filter for ad by roommate
  // await delay(400);
  // page.click("#txt-cta-center-modal-close-icon") //Close pop-up
  // await delay(4000);
   return page;
}



const KEYWORDS_POSITIVE = ["international",  "working"]
const KEYWORDS_NEGATIVE = [""]
const KEYWORDS_EXCLUDE = ["no registration"]


const MIN_SIZE_OF_TEXT = 200; // -1 if text is below this size
const PREF_SIZE_OF_TEXT = 800;


export default async function kamernetScrapper(headless){
  let scrapedLinkArray = []
  scrapedLinkArray = await getReactedToProperties();
  const width=1024, height=1600;
	const browser = await puppeteer.launch({headless: headless, 'defaultViewport' : { 'width' : width, 'height' : height }});
  await delay(function(){}, 300);
  const page = await browser.newPage();
  await page.setViewport( { 'width' : width, 'height' : height } );
  let pageCount = await getNumberOfPage(`https://kamernet.nl/en/for-rent/room-amsterdam`, page)
  console.log("DEBUG - finished getNumberOfPages "+getDateTimeString());
  await delay(function(){}, 400);
  await filterPage(page)
  console.log("DEBUG - finished filterPage");
  // pageCount = 1; //Used for testing new changes
  let roomLinks = [];
  for (let index = 1; index <= pageCount; index++) {
    let roomlink = await getList(`https://kamernet.nl/en/for-rent/room-amsterdam?pageno=${index}`, '.tile-wrapper', 'href', page)
    roomLinks.push.apply(roomLinks, roomlink);
    await delay(function(){}, 300);
  }
  console.log("DEBUG - finished getList "+getDateTimeString());

  // Get descriptions
  let fetchedText = [];
  for(let index = 0; index <= roomLinks.length; index++) {
    if(roomLinks[index]){
      let info = await getRoomInfo(roomLinks[index], page)
      // let added = await getDiv(roomLinks[index], '.published-date', page);
      if(info){
        fetchedText.push({
          desc: info.desc,
          link: roomLinks[index],
          price: info.price,
          size: info.size,
          added: info.added
        })
      }
    } else{
      console.log("URL undefined for room link index: "+index);
      console.log("length = "+roomLinks.length);

    }
    await delay(function(){}, 300);
  }
  console.log("DEBUG - finished descriptions "+getDateTimeString());
  let engPost = [];
  for (let index = 0; index < fetchedText.length; index++) {
    const element = fetchedText[index];
    if(franc(element.desc) == 'eng' && !checkInput(element.desc, KEYWORDS_EXCLUDE) && !scrapedLinkArray.includes(element.link)){

      let keywordRankerPosRes = await keyWordRankerPos(element.desc, KEYWORDS_POSITIVE)
      let rating =+ keywordRankerPosRes.rank

      let keywordRankerNegRes = await keyWordRankerNeg(element.desc, KEYWORDS_NEGATIVE)
      rating =+ keywordRankerNegRes.rank


      let posKeywordsFound = keywordRankerPosRes.keywords_found
      if(element.desc.length < MIN_SIZE_OF_TEXT){
        rating = rating - 1 ;
      }
      if(element.desc.length >= PREF_SIZE_OF_TEXT){
        rating = rating + 2 ;
      }

      scrapedLinkArray.push(element.link);
      engPost.push({link: element.link, rating: rating, new: element.new,  price: element.price, size: element.size, added: element.added, posKeywordsFound: posKeywordsFound})
    }
  }
  await browser.close();
  engPost.sort((a, b) => (a.rating > b.rating) ? -1 : 1)
  engPost.sort((a, b) => (a.new > b.rating) ? -1 : 1)
  await fsPromises.writeFile(KAMERNETPROPERTIESFILEPATH, JSON.stringify(scrapedLinkArray), 'utf8');
  return engPost;
};

function checkInput(input, words) {
  return words.some(word => input.toLowerCase().includes(word.toLowerCase()));
 }



async function keyWordRankerNeg(text, keywordsNegative ){
  let rank = 0;
  let keywords_found = []
  text = text.toLowerCase()
  for(let keyword of keywordsNegative){
      if(text.indexOf(keyword.toLowerCase()) != -1){
        rank = rank - 1;
        keywords_found.push(keyword)
      }
  }
  return {rank: rank, keywords_found: keywords_found};
}

async function keyWordRankerPos(text, keywordsPositive ){
  text = text.toLowerCase()
  let rank = 0;
  let keywords_found = []
  for(let keyword of keywordsPositive){
      if(text.indexOf(keyword.toLowerCase()) != -1){
        rank = rank+1;
        keywords_found.push(keyword)
      }
  }
  return {rank: rank, keywords_found: keywords_found};
}

async function getNumberOfPage(url, page){
  try{
    let div = `.pagination`;
    await page.goto(url);
    let numberDiv= await page.evaluate((div) =>{
      let pageinationParent = document.querySelector(div)
      let paginationChild = pageinationParent.querySelectorAll('li')
      let pageCount = []
      paginationChild.forEach(element => {
        pageCount.push(element.getAttribute('page'))
      });
      return Math.max(...pageCount)
    },div);
   return numberDiv;

  } catch (error) {
    console.log(error);
  }
}

/*
Needs refactoring badly !
*/

async function getRoomInfo(url, page){
  let info;
  try{
    await page.goto(url);
    await delay(function(){}, 300);
    info = await page.evaluate(() =>{
      added = (document.querySelector('.published-date')) ? document.querySelector('.published-date').textContent : "None";
      price = (document.querySelector('.price')) ? document.querySelector('.price').textContent : "None";
      size = (document.querySelector('.surface')) ? document.querySelector('.surface').textContent : "None";
      desc = (document.querySelector('.room-description')) ? document.querySelector('.room-description').textContent : "None";
      return {"added": added, "desc": desc, "price": price, "size": size};

    });
    return info;

  } catch (error) {
    console.log(error)
  }
}



// async function getDiv(url, div, page){
//   try{
//     if(url)
//     await page.goto(url);
//     let pageContent = await page.evaluate((url, div ) =>{
//       let titles = (document.querySelector(div))?document.querySelector(div).textContent : "None";
//       return titles
//     },url, div );
//     return pageContent;

//   } catch (error) {
//     console.log(error)
//   }
// }



async function getList(url, div , attr , page){
  try{
    await page.goto(url, {waitUntil: "networkidle2" });
    let pageContent = await page.evaluate((url, div , attr) =>{
      let titles = document.querySelectorAll(div)
      let titleLinks = [];
      for (let index = 0; index < titles.length; index++) {
        if(attr){
          titleLinks.push(titles[index].getAttribute(attr))
        }
        else{
          titleLinks.push(titles[index])
        }
      }
      return titleLinks
    },url, div , attr);
    return pageContent;

  } catch (error) {
    console.log(error);
  }
}

async function getReactedToProperties(){
  return JSON.parse(await fsPromises.readFile(KAMERNETPROPERTIESFILEPATH, 'utf-8', (err, data) => {
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
