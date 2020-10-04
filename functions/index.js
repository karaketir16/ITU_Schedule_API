const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});


const cheerio = require('cheerio');
// let restify = require('restify');
// const server = restify.createServer();
const iconv = require('iconv-lite');
var http  = require('http');

String.prototype.format = function() {
    let a = this;
    for (let k in arguments) {
      a = a.replace("{" + k + "}", arguments[k]);
    }
    return a;
  }

let str = '#body > table > tbody >\
              tr:nth-child(1) > td >\
              table:nth-child(3) > tbody >\
              tr > td:nth-child(2) > table >\
              tbody > tr:nth-child({0}) > td:nth-child({1})';



function retrieve(url, callback) {
  http.get(url, function(res) {
    res.pipe(iconv.decodeStream('win1254')).collect(callback);
  });
}

const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function getNew(code){
    return new Promise(async function(resolve, reject){
            retrieve("http://www.sis.itu.edu.tr/tr/ders_programlari/LSprogramlar/prg.php?fb={0}".format(code), (err, html) => {
            const $ = cheerio.load(html);
            let data = {};
            for(let i = 3; $(str.format(i ,1)).text();i++)
            {
                let crn = $(str.format(i,1)).text();
                data[crn] = {};
                data[crn].crn = $(str.format(i,1)).text();
                data[crn].code = $(str.format(i,2)).text();
                data[crn].title = $(str.format(i,3)).text();
                data[crn].instructor = $(str.format(i,4)).text();
                data[crn].building = $(str.format(i,5)).text();
                data[crn].days = $(str.format(i,6)).text().trimEnd().split(' ');
                data[crn].times = $(str.format(i,7)).text().trimEnd().split(' ').map( x => { return {start: x.split('/')[0], end: x.split('/')[1]};});
                data[crn].room = $(str.format(i,8)).text();
                data[crn].capacity = $(str.format(i,9)).text();
                data[crn].enrolled = $(str.format(i,10)).text();
                data[crn].reservation = $(str.format(i,11)).text();
                data[crn].major_restriction = $(str.format(i,12)).text().split(',').map(x => x.trim());
                data[crn].prerequisites = {...$(str.format(i,13)).text().split("ve ").map(x => x.split("veya").map(y => y.trim().replace(/^\(+|\)+$/g, '')))};
                data[crn].class_restriction = $(str.format(i,14)).text();
            }
            data.timeStamp = Math.floor(Date.now() / 1000);

            resolve(data);
        });
    });
}

exports.list = functions.https.onRequest(async (request, response) => {
    let code = request.query.code;
    if(code === undefined){
        response.send("ERR, no-code");
        return;
    }

    code = code.toUpperCase();

    // let time = Math.floor(Date.now() / 1000);

    // const codeRef = db.collection('codes').doc(code);
    // const doc = await codeRef.get();
    // if (!doc.exists) {
    //     console.log('No such document!');
    // } else {
    //     console.log('Document data:', doc.data());
    // }

    // await docRef.set({
    // first: 'Ada',
    // last: 'Lovelace',
    // born: 1815
    // });

    // const writeResult = await db.collection('messages').add({original: time});

    const codeRef = db.collection('codes').doc(code);
    const doc = await codeRef.get();
    
    let data = {};
    let update = true;
    if (!doc.exists) {
        update = true;
    } else {
        data = doc.data();
        if(Math.floor(Date.now() / 1000) - data.timeStamp > 60){
            update = true;
        }
        else{
            update = false;
        }
    }
    
    if(update){
        data = await getNew(code);
        await codeRef.set(data);
    }

    response.json(data);
    // functions.logger.info("Hello logs!", {structuredData: true});
    // response.send("Hello from Firebase!");
  });
  


// server.get("/:courseCode", function (req, res, next) {
//   retrieve("http://www.sis.itu.edu.tr/tr/ders_programlari/LSprogramlar/prg.php?fb={0}".format(req.params.courseCode), (err, html) => {
//     const $ = cheerio.load(html);
//     let data = {};
//     for(let i = 3; $(str.format(i ,1)).text();i++)
//     {
//       let crn = $(str.format(i,1)).text();
//       data[crn] = {};
//       data[crn].crn = $(str.format(i,1)).text();
//       data[crn].code = $(str.format(i,2)).text();
//       data[crn].title = $(str.format(i,3)).text();
//       data[crn].instructor = $(str.format(i,4)).text();
//       data[crn].building = $(str.format(i,5)).text();
//       data[crn].days = $(str.format(i,6)).text().trimEnd().split(' ');
//       data[crn].times = $(str.format(i,7)).text().trimEnd().split(' ').map( x => { return {start: x.split('/')[0], end: x.split('/')[1]};});
//       data[crn].room = $(str.format(i,8)).text();
//       data[crn].capacity = $(str.format(i,9)).text();
//       data[crn].enrolled = $(str.format(i,10)).text();
//       data[crn].reservation = $(str.format(i,11)).text();
//       data[crn].major_restriction = $(str.format(i,12)).text().split(',').map(x => x.trim());
//       data[crn].prerequisites = $(str.format(i,13)).text().split("ve ").map(x => x.split("veya").map(y => y.trim().replace(/^\(+|\)+$/g, '')));//var y = x.replace(/^\|+|\|+$/g, '');
//       data[crn].class_restriction = $(str.format(i,14)).text();
//     }
//     res.json(data);
//   });
// });


// server.get("/:courseCode/:crn", function (req, res, next) {
//   rp("http://localhost/{0}".format(req.params.courseCode))
//     .then( function (data) {
//       data = JSON.parse(data);
//       //console.log(data);
//       let ans = {};
//       for(let crn in data)
//       {
//         if ( ! data.hasOwnProperty(crn)) continue;
        
//         if(req.params.crn == crn)
//         {
//           ans = data[crn];
//           ans.crn = crn;
//         }
//       }
//       res.json(ans);
//     }
//   );
// });

// server.listen(80);
