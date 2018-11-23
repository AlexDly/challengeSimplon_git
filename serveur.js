/* var url=require('url');
var queryString=require('querystring');

var server=http.createServer(function(req,res){
	var page=url.parse(req.url).pathname;
	var param=url.parse(req.url).query;
	var params=queryString.parse(param);
	console.log("url: "+page);
	
	res.writeHead(200,{"Content-Type":"text/html"});

	if (page=="/index.html") {
		console.log("nom: "+params['nom']+" mdp: "+params['mdp']);
		res.write('<h1>Page index</h1>');
	}else if (page=="/admin.html") {
		console.log("nom: "+params['nom']+" mdp: "+params['mdp']);
		res.write('<h1>Page admin</h1>');
	}else if(page=='/favicon.ico'){
		console.log('favicon');
	}
	res.end();
});

server.listen(8080);

*/

var express=require('express');
var app=express();
var path=require('path');
var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');

var mongo=require('mongodb').MongoClient;
var mongoObject =require('mongodb');

var url="mongodb://localhost:27017/";

var connex=false;
var articles;
var users;
var totalPages;
articles = [];

app.set('view-engine','ejs');



function updateMongoDb(callback){

		mongo.connect(url,{ useNewUrlParser: true },function(err,db){
		if(err) throw err;
		var dbo=db.db("simplon_basedb");
		
		dbo.collection('articles').find({}).toArray(async function(err,result){
			if(err) throw err;

			articles=result;
			callback(articles);
			
			db.close();
		}); 
	});
}

function updateMongoDbUsers(callback){

		mongo.connect(url,{ useNewUrlParser: true },function(err,db){
		if(err) throw err;
		var dbo=db.db("simplon_basedb");
		
		dbo.collection('utilisateurs').find({}).toArray(async function(err,result){
			if(err) throw err;

			users=result;
			callback(users);
			
			db.close();
		}); 
	});
}


function getListArticles(){
	mongo.connect(url,{ useNewUrlParser: true },function(err,db){
		if(err) throw err;
		var dbo=db.db("simplon_basedb");
		
		dbo.collection('articles').find({}).toArray(function(err,result){
			if(err) throw err;
			db.close();
			articles = result; 
		}); 
	});

	return articles;

}

articles = getListArticles(); 



app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/blog/:p',function(req,res){
	var p=req.params.p;
	articles=getListArticles();

	
	var premierChiffre=(""+(articles.length)/10).substring(0,1);
	var deuxiemeChiffre=(""+(articles.length)/10).substring(2,3);

	console.log("premier chiffre: "+premierChiffre);
	console.log("deuxiemeChiffre: "+deuxiemeChiffre);
	
	if(deuxiemeChiffre>0){
		totalPages=parseInt(premierChiffre)+1;
	}else{
		totalPages=premierChiffre;
	}
	console.log(totalPages);
	articles=articles.slice((p-1)*10,p*10);

	res.setHeader('Content-Type','text/html');
	res.render('blog.ejs',{tableauArticles:articles,page:p,nbPages:totalPages});

}).get('/blog',function(req,res){

	res.redirect('/blog/1');

}).get('/admin',function(req,res){


	articles = getListArticles(); 
	console.log(req.cookies['connexion']);

	if(req.cookies['connexion'])
	{
		res.setHeader('Content-Type','text/html');
		res.render('dashboard.ejs',{tableauArticles:articles});
	}
	else{
		res.setHeader('Content-Type','text/html');
		res.render('admin.ejs');
	} 
	
}).get('/edition/:id',function(req,res){

	if (req.cookies['connexion']) {
		var query=req.params.id;

		console.log(query==0);

		if(query==0){

			res.setHeader('Content-Type','text/html');
			res.render('dashboardEdition.ejs',{ articleFound :"creation" });

		}else{
			//requete pour chercher objet correspondant à id
			mongo.connect(url,{ useNewUrlParser: true },function(err,db){

				if(err) throw err;
				var dbo=db.db("simplon_basedb");
				var o_id = new mongoObject.ObjectID(''+query);
				var qr = {"_id" : o_id };

				dbo.collection('articles').find(qr).toArray(function(err,result2){

					
					if(err) throw err;
					var article=result2;

					//afficher la page edition et envoyer l'article correspondant
					res.setHeader('Content-Type','text/html');
					res.render('dashboardEdition.ejs',{ articleFound :article });

					console.log(article[0].titre);

					db.close();
				});
			});
		}
			

	}else{
		res.redirect('/admin');
	}
		
}).get('/delete/:id',function(req,res){

	var query=req.params.id;

	//supprssion d'un document de la base mongo

	mongo.connect(url,{ useNewUrlParser: true }, function(err, db) {
  	if (err) throw err;
 	var dbo = db.db("simplon_basedb");
  	var o_id = new mongoObject.ObjectID(''+query);
	var qr = {"_id" : o_id };

	function redirection(red){
		res.redirect(red);
	}

  		dbo.collection("articles").deleteOne(qr, function(err, obj) {
		    if (err) throw err;
		    console.log("1 document deleted");
		    db.close();

		    updateMongoDb(function(result){
			var newArticles=result;
			redirection('/admin');
			});
  		});
	});

}).get('/article/:id',function(req,res){
	var query=req.params.id;

	//requete pour chercher objet correspondant à idVariable
			mongo.connect(url,{ useNewUrlParser: true },function(err,db){

				if(err) throw err;
				var dbo=db.db("simplon_basedb");
				var o_id = new mongoObject.ObjectID(''+query);
				var qr = {"_id" : o_id };

				dbo.collection('articles').find(qr).toArray(function(err,result2){
					
					if(err) throw err;
					var article=result2;

					//afficher la page edition et envoyer l'article correspondant
					res.setHeader('Content-Type','text/html');
					res.render('article.ejs',{ articleFound :article });

					console.log(article[0].titre);

					db.close();
				});
			});


			// Partie Utilisateurs
}).get('/users',function(req,res){
	mongo.connect(url,{ useNewUrlParser: true },function(err,db){
		if(err) throw err;
		var dbo=db.db("simplon_basedb");
		
		dbo.collection('utilisateurs').find({}).toArray(async function(err,result){
			if(err) throw err;

			users=result;
			console.log(users);

			
			db.close();

			res.setHeader('Content-Type','text/html');
			res.render('dashboardUsers.ejs',{ utilisateurs :users });
		}); 
	});

	


}).get('/users/:id',function(req,res){

	if (req.cookies['connexion']) {
		var query=req.params.id;

		if(query==0){

			res.setHeader('Content-Type','text/html');
			res.render('dashboardEditionUsers.ejs',{ user :"creation" });

		}else{
			//requete pour chercher objet correspondant à id
			mongo.connect(url,{ useNewUrlParser: true },function(err,db){

				if(err) throw err;
				var dbo=db.db("simplon_basedb");
				var o_id = new mongoObject.ObjectID(''+query);
				var qr = {"_id" : o_id };

				dbo.collection('utilisateurs').find(qr).toArray(function(err,result2){

					
					if(err) throw err;
					var utilisateur=result2;

					//afficher la page edition et envoyer l'user correspondant
					res.setHeader('Content-Type','text/html');
					res.render('dashboardEditionUsers.ejs',{ user :utilisateur });

					db.close();
				});
			});
		}
}

}).get('/deleteUsers/:id',function(req,res){

	var query=req.params.id;

	//supprssion d'un document de la base mongo

	mongo.connect(url,{ useNewUrlParser: true }, function(err, db) {
  	if (err) throw err;
 	var dbo = db.db("simplon_basedb");
  	var o_id = new mongoObject.ObjectID(''+query);
	var qr = {"_id" : o_id };

	function redirection(red){
		res.redirect(red);
	}

  		dbo.collection("utilisateurs").deleteOne(qr, function(err, obj) {
		    if (err) throw err;
		    console.log("1 document deleted");
		    db.close();

		    updateMongoDbUsers(function(result){
			var newUsers=result;
			redirection('/users');
			});
  		});
	});

}).get('/inscription',function(req,res){

	res.setHeader('Content-Type','text/html');
	res.render('inscription.ejs');
});










app.listen(8080);

app.post('/post',function(req,res){

	var nom=req.body.nom;
	var mdp=req.body.mdp;
	console.log("nom: "+nom);
	console.log("mot de passe: "+mdp);

	if(nom=="alex" && mdp=="123456")
	{
		// Créer un cookie de connexion réussi
		connex=true;
		res.cookie('connexion',connex,{expire: 360000 + Date.now()});

		res.setHeader('Content-Type','text/html');
		res.render('dashboard.ejs',{tableauArticles:articles});

	}else{
		res.setHeader('Content-Type','text/html');
		res.render('admin.ejs');
		// res.redirect('/admin.html')
	}

});

app.post('/createOrModif',function(req,res){

	var query=req.body.identifiant;
	var title=req.body.titleArticle;
	var sstitle=req.body.sstitleArticle;
	var resumed=req.body.resumeArticle;
	var contenair=req.body.contenuArticle;
	var autor=req.body.auteurArticle;
	var img=req.body.imageArticle;
	var createOrmodif=req.body.crOrmdf;

	if(createOrmodif=='modif'){
		console.log(query);
		//Modifier la base de données

	mongo.connect(url,{ useNewUrlParser: true },function(err,db){
	if(err) throw err;
	var dbo=db.db("simplon_basedb");
	var o_id = new mongoObject.ObjectID(''+query);
	var qr = {"_id" : o_id };
	var newvalues = { $set: {titre: title, sstitre: sstitle,resume:resumed,contenu:contenair,auteur:autor,image:img } };

	function redirection(red){
		res.redirect(red);
	}

	dbo.collection('articles').updateOne(qr, newvalues,function(err, res){
		if(err) throw err;

		updateMongoDb(function(result){
			var newArticles=result;
			console.log(newArticles);
			redirection('/admin');
		});
		db.close();
		
	}); 
});

	}else{
		//creer dans la base de données
		mongo.connect(url, function(err, db) {

  		if (err) throw err;
		  var dbo = db.db("simplon_basedb");
		  var myobj = { titre: title, sstitre: sstitle,resume:resumed,contenu:contenair,auteur:autor,image:img };

		 function redirection(red){
			res.redirect(red);
		}

		  dbo.collection("articles").insertOne(myobj, function(err, res) {
		    if (err) throw err;
		    console.log("document inserted");

		    updateMongoDb(function(result){
			var newArticles=result;
			console.log(newArticles);
			redirection('/admin');
			});

		    db.close();
		  });
		});


	}
});



app.post('/createOrModifUser',function(req,res){

	var query=req.body.identifiant;
	var name=req.body.nomUser;
	var mail=req.body.emailUser;
	var motdp=req.body.mdpUser;
	
	var createOrmodif=req.body.crOrmdf;

	if(createOrmodif=='modif'){
		
		console.log(query);
		//Modifier la base de données

	mongo.connect(url,{ useNewUrlParser: true },function(err,db){
	if(err) throw err;
	var dbo=db.db("simplon_basedb");
	console.log(query);
	var o_id = new mongoObject.ObjectID(''+query);
	var qr = {"_id" : o_id };
	var newvalues = { $set: {nom: name, email: mail,mdp:motdp } };

	function redirection(red){
		res.redirect(red);
	}

	dbo.collection('utilisateurs').updateOne(qr, newvalues,function(err, res){
		if(err) throw err;

		updateMongoDbUsers(function(result){
			
			redirection('/users');
		}); 
		db.close();
		
	}); 
});


	}else{
		//creer dans la base de données
		mongo.connect(url, function(err, db) {

  		if (err) throw err;
		  var dbo = db.db("simplon_basedb");
		  var myobj = { nom: name, email: mail,mdp:motdp };

		 function redirection(red){
			res.redirect(red);
		}

		  dbo.collection("utilisateurs").insertOne(myobj, function(err, res) {
		    if (err) throw err;
		    console.log("document inserted");

		    updateMongoDbUsers(function(result){
			
			redirection('/users');
			});

		    db.close();
		  });
		});


	}
});

app.post('/postInscription',function(req,res){

	var name=req.body.nom;
	var motdp=req.body.mdp;
	var mail=req.body.email;

	//Creation d'un uvel utilisateur dans la base
	mongo.connect(url, function(err, db) {

  		if (err) throw err;
		  var dbo = db.db("simplon_basedb");
		  var myobj = { nom: name, email: mail,mdp:motdp };

		 function redirection(red){
			res.redirect(red);
		}

		  dbo.collection("utilisateurs").insertOne(myobj, function(err, res) {
		    if (err) throw err;
		    console.log("document inserted");

		    updateMongoDbUsers(function(result){
			
			redirection('/blog');
			});

		    db.close();
		  });
		});
});
