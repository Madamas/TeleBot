const Telegraf = require('telegraf'),
		fs = require('fs'),
 	    https = require('https'),
 	    telegraph = require('telegraph-node'),
 	    ph = new telegraph(),
 	    request = require('request'),
 	    express = require('express'),
 	    bodyParser = require('body-parser'),
 	    router = express.Router();
var Picasa = require('picasa')
var picasa = new Picasa()
var { URL } = require('url')
var count,staticCount = 0
var waiting = false
var arr = []
var array = []
var links = []
var re = /<\d+>/;
var subj
var config = require('./config.js')
var app = new express()

var logger = function(req, res, next) {
    console.log(`${req.body}`);
    next(); // Passing the request to the next handler in the stack.
}

const bot = new Telegraf(config.token)
bot.telegram.setWebhook(`${config.url}/bot${config.token}`)
bot.use(Telegraf.memorySession())
app.use(bot.webhookCallback(`/bot${config.token}`))

var parseFile = function(file,ctx){
	fs.readFile(file,'utf8', (err,data)=>{
		arr = data.split(re)
		staticCount = count = arr.length - 1 
		if(staticCount == 0){
			merger(ctx)
		}else{
		ctx.reply(`Got your document, need ${count} picture(s)`)
		}
	})
}

// var getPhoto = function(url,ctx,count){
// 	var imagedata = ''
// 	var requestSettings = {
// 		method: 'GET',
// 		url: url,
// 		encoding: null
// 	}
// 	request(requestSettings, (error,response,body)=>{
// 		const photoData = {
// 			      	title: `${Math.floor(Date.now() / 1000)}`,
// 			      	summary: '',
// 			      	contentType: 'image/jpg',
// 			      	binary: body
// 			}

// 		   picasa.postPhoto(config.accessToken, config.albumId, photoData, (error, photo) => {
// 				if(error){
// 				 	const conf = {
// 				 		clientId: config.clientId,
// 				 		redirectURI: config.redirectURI,
// 				 		clientSecret: config.clientSecret
// 				 	}
// 				 	picasa.renewAccessToken(conf, config.refreshToken, (error, accessToken) => {
// 					  config.accessToken = `${accessToken}`
// 					})
// 				 }else{
// 				  console.log(error, photo)
// 				  return photo.content.src;
// 				}
// 			})
// 	})
// }

var getPhoto = function(url,ctx,count){
	return new Promise((resolve,reject)=>{
		var requestSettings = {
			method: 'GET',
			url: url,
			encoding: null
		}
		request(requestSettings, (error,response,body)=>{
			const photoData = {
				      	title: `${Math.floor(Date.now() / 1000)}`,
				      	summary: '',
				      	contentType: 'image/jpg',
				      	binary: body
				}
				if(error){
					reject(error)
				}else{
					picasa.postPhoto(config.accessToken, config.albumId, photoData, (error, photo) => {
				   	if(error){
					   	const conf = {
						   	clientId: config.clientId,
						   	redirectURI: config.redirectURI,
						   	clientSecret: config.clientSecret
					   	}
					   	picasa.renewAccessToken(conf, config.refreshToken, (error, accessToken) => {
					   	  config.accessToken = `${accessToken}`
					   	})
				   	}else{
					   	resolve(photo.content.src)
				   	}
				   	})}
		})
	})
}

var downloadDoc = function(url, dest, ctx) {
  var file = fs.createWriteStream(dest);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      console.log('Downloaded')
      parseFile(__dirname+'/temp.md',ctx)
    });
  });
};

var merger = function(ctx){
	console.log(links)
	for (var i = 0; i <= staticCount; i++) {
		array.push({tag: 'h4',children: [arr.shift()]})
		array.push({tag: 'img', attrs: {src: links.shift()}})
	}
	array.push(arr.pop())
	ctx.reply('Please tell me name of subject')
	waiting = true
}

const fileDownloadMiddleware = (ctx,next) => {
	return bot.telegram.getFileLink(ctx.message.document)
		.then((link) => {
			ctx.state.fileLink = link
			downloadDoc(link,__dirname+'/temp.md',ctx)
			return next()
		})
}
bot.on('document',fileDownloadMiddleware, (ctx,next) => {
	console.log('Doc url:',ctx.state.fileLink)
})
bot.on('text',(ctx)=>{
	if(waiting){
		ph.createPage(config.phToken,ctx.message.text,array,{
				return_content: true
			}).then((result)=>{
				console.log(result)
				ctx.reply(result.url)
				return result
			})
		waiting = false
	}else{
		ctx.reply("I don't listen to you")
	}
})
bot.on('photo',(ctx) =>{
	console.log(links)
	if(count > 0){
		return bot.telegram.getFileLink(ctx.message.photo[2])
		.then((link)=>{
			getPhoto(link,ctx,count)
			.then((link)=>{
				links.push(`${link}`)
				count--
				if(count == 0){
				ctx.reply("That's all. Merging")
				merger(ctx)
				}else{	
				ctx.reply(`Need only ${count} more picture(s)`)
				}
			})
		})
	}else{
		ctx.reply("Wait, I didn't recieve any documents")
	}
})

// app.configure(function(){
//     app.use(logger); // Here you add your logger to the stack.
//     app.use(app.router); // The Express routes handler.
// });

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res){
    console.log(`${req.body}`);
});

app.listen(process.env.PORT);



//bot.startPolling()