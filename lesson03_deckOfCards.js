window.addEventListener('load',function(){
    document.getElementById('deal').addEventListener("click", deal);
    document.getElementById('draw').addEventListener('click',draw);
    document.getElementById('reDeal').addEventListener('click',dealAgain);
    document.getElementById('stay').addEventListener('click',showDealer);
    document.getElementById('wager').addEventListener('input',checkWager);
    document.getElementById('borrow').addEventListener('click',borrowCash);

    document.getElementById('bet100').addEventListener('click',function () {
        makeBet(100);
    });
    document.getElementById('betHalf').addEventListener('click',function () {
        makeBet(0.5);
    });
    document.getElementById('betAll').addEventListener('click',function () {
        makeBet(1);
    });

    // Force wager to use mouse input
    const mouseOnlyNumberInputField = document.getElementById("wager");
    mouseOnlyNumberInputField.addEventListener("keypress", (event) => {
        event.preventDefault();
    });
});

const Card = function(cssClass,rank,suit,html){
    
    this.cssClass=cssClass;
    this.rank = rank;
    this.suit = suit;
}


const Cards = function () {

    // Holds the array of card objects
    this.deck = [];
    this.currentDeck= [];

    // Initialize the user bank
    let ss = sessionStorage.getItem("userBank");
    if (ss == "NaN" || ss === null) {
        sessionStorage.setItem("userBank", "1000");
    }

    // User is broke
    if (parseInt(ss) < 100) {
        document.getElementById('draw').disabled = true;
        document.getElementById('stay').disabled = true;
        document.getElementById('reDeal').disabled = true;
        document.getElementById('borrow').style.visibility='visible';
    }


    // Set the users available bank
    document.getElementById('bank').value = parseInt( sessionStorage.getItem("userBank"));

    const cards =['2','3','4','5','6','7','8','9','10','j','q','k','a'];
    const face = {'j':10,'q':10,'k':10,'a':11};
    const suits = ['diams','hearts','spades','clubs'];

    // Create the complete deck of cards
    for(let s of suits){
        for(let c of cards){
            let card = new Card();
            card.cssClass = `card rank-${c} ${s}`;
            card.rank = c;
            card.suit = s;
            card.value = isNaN(c) ?  face[c] : parseInt(c);

            this.deck.push(card);
        }
    }

    // make a copy of the current deck
    this.currentDeck = [...this.deck];

    // Deal the cards
    this.dealAll = function () {
        let hand=document.getElementById('cards');

        for(let c of this.deck){
            this.addCardToUI('cards',c);
        }
    }

    // Draw cards
    this.drawCard = function (target,total) {

        let pos = Math.floor(Math.random() * this.currentDeck.length-1);
        let card = this.currentDeck.splice(pos,1)[0];

        // set ace to 1 or 11 based on the current total
        if (card.rank=='a'){
            if (parseInt(document.getElementById(total).value) > 10){
                card.value=1;
            }
        }

        this.addCardToUI(target,card);
        document.getElementById(total).value = parseInt(document.getElementById(total).value) + card.value;
        checkValue(total);
    }

    // Initialize the game
    this.dealerStart = function () {

        // Dealer cards
        let pos = Math.floor(Math.random() * this.currentDeck.length - 1);
        let card = this.currentDeck.splice(pos, 1)[0];
        this.addCardToUI('bjDealer', card);
        document.getElementById('dealerTotal').value = card.value;


        // User cards
        document.getElementById('status').innerHTML="";
        let userTotal = 0;
        for(let i=0;i<2;i++) {
            let upos = Math.floor(Math.random() * this.currentDeck.length - 1);
            let ucard = this.currentDeck.splice(upos, 1)[0];
            this.addCardToUI('bjCards', ucard);
            userTotal += ucard.value;
        }
        document.getElementById('userTotal').value = userTotal;
        checkValue('userTotal');
    }

    this.addCardToUI = function (target,card) {

        let hand = document.getElementById(target);
        let cardDiv = document.createElement('DIV');
        cardDiv.setAttribute('class',card.cssClass);

        let cardRank =document.createElement('span');
        cardRank.setAttribute('class','rank');
        cardRank.innerHTML= card.rank;
        cardDiv.appendChild(cardRank);

        let cardSuit =document.createElement('span');
        cardSuit.setAttribute('class','suit');
        cardSuit.innerHTML=`&${card.suit};`;
        cardDiv.appendChild(cardSuit);
        hand.appendChild(cardDiv);
    }
}

//
const checkValue = function(target){

    let  draw = document.getElementById('draw');
    let  stay = document.getElementById('stay');
    let  reDeal = document.getElementById('reDeal');

    let val  = document.getElementById(target).value

    if (val >  21){
        draw.disabled=true;
        stay.disabled=true;
        reDeal.style.visibility='visible';

        if (target == 'userTotal') {
            document.getElementById('status').innerHTML = "Busted Fool";
            updateBank('lose');

        }
        else{
            document.getElementById('status').innerHTML ="Dealer busts, you win";
            updateBank('win');
        }
    }
}

// Select a card for the user target,total
const draw = function () {
    cards.drawCard('bjCards','userTotal');
}

//
const showDealer = function () {
    let dealer = document.getElementById('bjDealer');
    let elem = document.getElementById('faceDown');
    document.getElementById('deal').disabled = 'true';

    elem.parentNode.removeChild(elem);

    while (parseInt(document.getElementById('dealerTotal').value) < 16 ) {
        cards.drawCard('bjDealer', 'dealerTotal');
    }
    let  draw = document.getElementById('draw');
    let  stay = document.getElementById('stay');
    let  reDeal = document.getElementById('reDeal');
    draw.disabled=true;
    stay.disabled=true;
    reDeal.style.visibility='visible';

    let dealerTotal  =parseInt( document.getElementById('dealerTotal').value);
    let playerTotal  = parseInt(document.getElementById('userTotal').value);

    if (playerTotal > dealerTotal || dealerTotal > 21) {
        document.getElementById('status').innerHTML = "You win";
        updateBank('win');
    }
    else if (playerTotal == dealerTotal){
        document.getElementById('status').innerHTML ="Push, fool";
    }
    else {
        document.getElementById('status').innerHTML ="You lose, chump";
        updateBank('lose');
    }
}
// Restart the game
const dealAgain = function () {
    location.reload();
}


// User cannot bet more than he has in the bank
const checkWager = function () {
    let wager = document.getElementById('wager');
    let bank = document.getElementById('bank');

    wager.max  = parseInt( bank.value);
}

const updateBank = function (status) {

    let bank = parseInt( sessionStorage.getItem("userBank"));
    let wager=parseInt(document.getElementById('wager').value);

    if (status == 'lose') {
        let newval = (bank -  wager).toString();
        sessionStorage.setItem("userBank", newval);
    }
    else {
        let newval = (bank  +  wager).toString();
        sessionStorage.setItem("userBank", newval);
    }
    document.getElementById('bank').value = parseInt( sessionStorage.getItem('userBank'));
}

const borrowCash = function () {
    document.getElementById('borrow').style.visibility='hidden';

    document.getElementById('deal').disabled = true;
    document.getElementById('stay').disabled = true;
    // document.getElementById('reDeal').style.visibility='visible';
    //
    let nodes = document.getElementById('wagerGroup').getElementsByTagName('button');
    for(let n of nodes){
        n.disabled='true';
    }

    sessionStorage.setItem("userBank", '1000');
    document.getElementById('bank').value = parseInt(sessionStorage.getItem('userBank'));

    dealAgain();
}

const deal = function () {
    if (parseInt(document.getElementById('wager').value) > 0){

        //
        document.getElementById('faceDown').style.visibility='visible';
        let node = document.getElementById('placeHolder');
        if (node.parentNode){
            node.parentNode.removeChild(node);
        }

        cards.dealerStart();

        document.getElementById('draw').disabled = false;
        document.getElementById('stay').disabled = false;
        document.getElementById('reDeal').disabled = false;

        let nodes = document.getElementById('wagerGroup').getElementsByTagName('button');
        for(let n of nodes){
            n.disabled='true';
        }
    }

    else{
        alert("You must make a wager!");
    }

}

const makeBet = function (amount) {

    let wager = document.getElementById('wager');
    let maxVal = parseInt(document.getElementById('bank').value);
    let bet;

    if (amount == 0.5){
        bet = Math.round(maxVal * .5)
    }
    else if (amount == 1){
        bet=maxVal;
    }
    else{
        bet=100;
    }
    wager.value = bet;

    document.getElementById('')
    document.getElementById('deal').disabled = false;




}


var cards = new Cards();


