var Picasa = require('picasa')
var picasa = new Picasa()
const config = {
	clientId: '187099064834-uvnr3d37hsuo0p4fgm5sfk7rjvqr7o8v.apps.googleusercontent.com',
	redirectURI: 'https://7cecb243.ngrok.io',
	clientSecret: 'RhLiMDbljjhe9QnMqZe1nPhj',
	accessToken: 'ya29.GlviBKR3td5nTtbMZe55-bKB67oIP4zIKBJyrq6QHrIdf8hplpWGZ-0LKN5WeFFpnWxujuJ-5tsu-g-8l3F5s62TbBmX0kILqSSu4RRuMkVotGr_Nxo-ZYe7fTDs',
	refreshToken: '1/a3brHikIBHBpOho9rD4tkQ9H_uYglmIlZEjhRk_3Wf0ny_qbDAtri1LUhSNnsDO9',
	code: '4/AgQwA2UwfFZ0ryYyHse544CkHnRyRkpYA6ncjBy8VVo',
	album: '6476090934286675777'
}


picasa.getAlbums(config.accessToken, {},  (error, albums) => {
  console.log(error, albums)
})
