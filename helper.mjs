
import fs from 'fs';
import nodemailer from 'nodemailer';
import AWS from "aws-sdk";

export function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}




export function formatText(kamernetPosts, roofzPosts, failed){
    let HTML =`
    <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-alpha.4/css/materialize.min.css">
    </head>
      <div>
      <h2>Accommodation Bot found something!</h2>
      <h3 display=${(failed == [])? "none" : "block"} style ="background-color: red; color: white ">!Failed servies!:${failed}</h3> 
      <h3>Kamernet</h3>
            <table style="width:95%; margin:auto">
            <tr>
                <th>Keywords found</th>
                <th>Link</th>
                <th>Rating</th> 
                <th>price</th> 
                <th>Size</th> 
                <th>Added</th> 
            </tr>
    `;
    for(let kamernetPost of kamernetPosts){
        HTML = HTML+`
        <tr ${(kamernetPost.new)?`style ="background-color: lightgreen"`:null}>
        <td>${kamernetPost.posKeywordsFound}</td>
        <td><a href=${kamernetPost.link}>Click Here</a></td>
        <td>n/a</td> 
        <td>${kamernetPost.price}</td>
        <td>${kamernetPost.size}</td>
        <td>${kamernetPost.added}</td>
        </tr>
      `
    }
    HTML = HTML + `</table></div>`
    HTML = HTML + `<h3>Roofz</h3>
    <table style="width:95%; margin:auto">
      <tr>
          <th>Links to new posts found on Roofz</th>
      </tr>
    `
    for(let roofzPost of roofzPosts){
        HTML = HTML+`
        <tr>
        <td><a href=${roofzPost.url}>${roofzPost.url}</a></td>
        </tr>
      `
    }
    HTML = HTML + `</table></div>`
    HTML = HTML + `<div>
    <h3>Apartment Reaction Info</h3>
    <h4>Mobile Number</h4>
    ${process.env.PHONE}
    <h4>Apartment Reaction Text</h4>
    Hello, my name is Andrew Heath. I moved to the Netherlands four years ago to study. I and have now finished studying and will be starting to work as a Data Engineer at Logex (in Amsterdam) on October 1st with a monthly salary of 3,500 euro (before tax). I will work primarily at the office and from home a couple of days a week.
    I am a clean and respectful tenant and ADDRESS would be a great location for me as it is in cycle distance to where I will work. 
    I hope you feel I am a good match for the apartment, I am available any time for a viewing.
    Kind regards

    Andrew Heath
    </div>`

    return HTML;
  }


export function writeToFile(content, fileName){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var time = new Date().getTime().toString();
    today = mm + '_' + dd + '_' + yyyy;
    fs.writeFile(`found_postings_${today}_${time}.html`, content, err => {
        if (err) {
        console.error(err)
        return
        }
    //file written successfully
    })
}
export async function sendMail(htmlBody){
  AWS.config.update({
    region: process.env.AWS_REGION  ,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  const mailer = nodemailer.createTransport({
    SES: new AWS.SES(),
  });
  await mailer.sendMail({
    from:  process.env.FROMEMAIL,
    to:  process.env.TOEMAIL,
    subject: "Accomdation Bot found something!",
    html: htmlBody,

  });
}