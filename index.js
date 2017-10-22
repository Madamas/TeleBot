const Telegraf = require('telegraf'),
		fs = require('fs'),
 	    https = require('https'),
 	    telegraph = require('telegraph-node'),
 	    ph = new telegraph();
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

var getPhoto = function(url,ctx,count){
	var imagedata = ''
	var request = https.get(url, function(response) {
		console.log(url)
		response.setEncoding('binary')


		response.on('data',(chunk) => {
			imagedata += chunk
		})
		response.on('end',() => {
			const photoData = {
			      	title: `${count}`,
			      	summary: '',
			      	conentType: 'image/jpg',
			      	binary: imagedata
			}

		    picasa.postPhoto(config.accessToken, config.albumId, photoData, (error, photo) => {
				  console.log(error, photo)
				  return photo;
			})
		})
		response.on('error',(err)=>{
			console.log('Error during https request')
		})
  });
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

const bot = new Telegraf(config.token)
bot.use(Telegraf.memorySession())
bot.on('document',fileDownloadMiddleware, (ctx,next) => {
	console.log('Doc url:',ctx.state.fileLink)
	//return ctx.reply(`Message count ${ctx.session.counter}`)
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
			links.push(getPhoto(link,ctx,count))
			count--
			if(count == 0){
			ctx.reply("That's all. Merging")
			merger(ctx)
		}else{	
		ctx.reply(`Need only ${count} more picture(s)`)
		}
		})
	}else{
		ctx.reply("Wait, I didn't recieve any documents")
	}
})
bot.startPolling()