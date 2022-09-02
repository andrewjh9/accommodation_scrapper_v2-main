import spawn from 'await-spawn';



export default async function facebookScraper(){
    const list = await spawn('python', ['facebook_page_scraper.py']);
    console.log(list)
}

