var request = require("request");
const express = require('express')
const app = express()
const creditCards = require('./credit')

const pkg = require('./package')
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser());

var fs = require('fs');

const port = process.env.PORT || 4000

function verifyToken(req, res, next) {
    let auth = req.headers.authorization
    if (auth) {
        auth = auth.split(' ')[1]
        let options = {
            method: 'POST',
            url: 'http://comp-ms-auth.herokuapp.com:80/api/verify',
            headers:
                { Authorization: 'Bearer ' + auth }
        }
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            body = JSON.parse(body)
            if (body.loged) {
                req.payload = body
            }
            next()
        })
    } else {
        next()
    }
}


app.get('/', function (req, res) {
    res.send("Hello")
})
app.get('/api/versao', function (req, res) {
    console.log(pkg.version)
    res.send("Hello")
})

app.post('/buy',verifyToken,function (req,res) {
    let payload = req.payload
   
    if(payload){
        var card = req.body.card;
        var valor = req.body.valor;

        console.log(card)
        console.log(valor)

        for (var i = 0; i < creditCards.length; i++){           
            if (creditCards[i].number == card){
              if(creditCards[i].limit >= valor)
                creditCards[i].limit = creditCards[i].limit - valor

            }
        }
        res.status(202).send("Accepted")
    } else{       
        res.status(401).send("Não autorizado")

    }
})
app.post('/balance',verifyToken,function (req,res) {
    let payload = req.payload
   
    if(payload){
        var card = req.body.card;
        var valor = req.body.valor;

        console.log(card)
        console.log(valor)

        if(validade(card) == true && saldo(valor, card) == true)
            res.status(202).send("Accepted")
        else
            res.status(401).send("Erro: Não Autorizado a compra!")
     
    } else{       
        res.status(401).send("Não autorizado")

    }
})

function saldo(valor, card){
    for (var i = 0; i < creditCards.length; i++){           
        if (creditCards[i].number == card){
          if(creditCards[i].limit >= valor)
          return true
        }
    } 
}
function valida (card){
    var date = new Date()
    var currentMonth = date.getMonth() + 1
    var currentYear = date.getFullYear()
    var dateSplit = card.date.split('/')
    var cardMonth = parseInt(dateSplit[0],10)
    var cardYear = parseInt(dateSplit[1],10) + 2000

    if (cardYear < currentYear || (cardYear == currentYear && cardMonth < currentMonth)) {
        return false
    }
    else{
        return true
    }
}

function findCreditCard (creditCardNumber){
    filePath = './credit.json'
    const fs = require(filePath)

    for (var i = 0; i < creditCards.length; i++){           
        if (creditCards[i].number == creditCardNumber){
            return creditCards[i]
        }
    }
}


app.get('/status/:card', function (req,res) {    
    var card = findCreditCard(req.params.card)
    res.status(200).send(cardDateValidator(card))
})


Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}


app.get('/networks', function(req,res){ 
    let networks=[creditCards[0].network]
    creditCards.forEach(element => {
        if(!networks.contains(element.network)){
            networks.push(element.network)
        }
    });
    res.status(200).json(networks)        
});


app.listen(port, function () {
    console.log("Rodando na porta:", port)
})