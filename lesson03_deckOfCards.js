
// Bind eventhandlers
window.addEventListener('load',function(){
    document.getElementById('deal').addEventListener("click", deal);
    document.getElementById('draw').addEventListener('click',draw);
    document.getElementById('reDeal').addEventListener('click',dealAgain);
    document.getElementById('stay').addEventListener('click',showDealer);
    document.getElementById('wager').addEventListener('input',checkWager);
    document.getElementById('borrow').addEventListener('click',borrowCash);

    // Pass argument to eventhandler
    document.getElementById('bet100').addEventListener('click',function () {
        makeBet(100);
    });
    document.getElementById('betHalf').addEventListener('click',function () {
        makeBet(0.5);
    });
    document.getElementById('betAll').addEventListener('click',function () {
        makeBet(1);
    });
});

// Card object constructor
const Card = function(cssClass,rank,suit){
    
    this.cssClass=cssClass;
    this.rank = rank;
    this.suit = suit;

    // calculate numeric value of the card
    const face = {'j':10,'q':10,'k':10,'a':11};
    this.value = isNaN(rank) ?  face[rank] : parseInt(rank);
    this.originalValue = isNaN(rank) ?  face[rank] : parseInt(rank);

    // Aces are 11 by default
    this.isSoft = false;
}

// Cards collection object
const Cards = function () {

    // Holds the array of card objects
    this.deck = [];
    this.currentDeck= [];

    // Initialize the user bank if it doesnt exist in the session
    let ss = sessionStorage.getItem("userBank");
    if (ss == "NaN" || ss === null) {
        sessionStorage.setItem("userBank", "1000");
    }

    // User account is less than minimum wager
    if (parseInt(ss) < 100) {
        document.getElementById('draw').disabled = true;
        document.getElementById('stay').disabled = true;
        document.getElementById('reDeal').disabled = true;
        document.getElementById('borrow').style.visibility='visible';
    }

    // Set the users available bank
    document.getElementById('bank').value = parseInt( sessionStorage.getItem("userBank"));

    // data for deck of cards
    const cards =['2','3','4','5','6','7','8','9','10','j','q','k','a'];
    const suits = ['diams','hearts','spades','clubs'];

    // Create the complete deck of cards
    for(let s of suits){
        for(let c of cards){
            // Call the card constructor
            let card = new Card(`card rank-${c} ${s}`,c,s);
            // Add card to the complete deck
            this.deck.push(card);
        }
    }

    // Copy the complete deck in the current deck to prevent reselection of a card within a game
    this.currentDeck = [...this.deck];

    // Deal a single card and remove from the current deck
    this.drawCard = function (target,total) {

        let pos = Math.floor(Math.random() * this.currentDeck.length-1);
        let card = this.currentDeck.splice(pos,1)[0];

        // If the card is an Ace, set the default value to prevent player from losing
        if (card.rank=='a'){
            if (parseInt(document.getElementById(total).value) > 10){
                card.value=1;
                card.isSoft=true;
            }
        }

        // Add the card to the page and update the score
        this.addCardToUI(target,card);
        document.getElementById(total).value = parseInt(document.getElementById(total).value) + card.value;

        // Evaluate the value to see if its over 21
        checkValue(total);
    }

    // Initialize the game
    this.startGame = function () {

        // Select a single card for the dealer
        let card = this.getRandomCard();
        this.addCardToUI('bjDealer', card);
        document.getElementById('dealerTotal').value = card.value;

        // Deal 2 cards to the user
        document.getElementById('status').innerHTML="";
        let userTotal = 0;
        for(let i=0;i<2;i++) {
            let ucard = this.getRandomCard();
            this.addCardToUI('bjCards', ucard);
            userTotal += ucard.value;
        }
        document.getElementById('userTotal').value = userTotal;
        checkValue('userTotal');
    }

    // Select a random card
    this.getRandomCard = function () {
        let pos = Math.floor(Math.random() * this.currentDeck.length - 1);
        return this.currentDeck.splice(pos, 1)[0];
    }

    // Add a card to the page
    this.addCardToUI = function (target,card) {

        let hand = document.getElementById(target);
        let cardDiv = document.createElement('DIV');

        // Bind datapoint to the
        Object.assign(cardDiv,{value:card.value,rank:card.rank,suit:card.suit,isSoft:card.isSoft,originalValue:card.originalValue});

        cardDiv.setAttribute('class',card.cssClass);

        let cardRank =document.createElement('span');
        cardRank.setAttribute('class','rank');
        cardRank.innerHTML= card.rank;
        cardDiv.appendChild(cardRank);

        let cardSuit =document.createElement('span');
        cardSuit.setAttribute('class','suit');
        cardSuit.innerHTML=`&${card.suit};`;
        cardDiv.appendChild(cardSuit);

        // add event listener that captures card value
        cardDiv.addEventListener('click',function () {
            changeAce(card);
        });

        hand.appendChild(cardDiv);
    }
}

// Check the sum of the cards after deal
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

// Deal the house cards
const showDealer = function () {
    let dealer = document.getElementById('bjDealer');
    let elem = document.getElementById('faceDown');
    document.getElementById('deal').disabled = 'true';

    elem.parentNode.removeChild(elem);

    // Dealer hits at 16
    while (parseInt(document.getElementById('dealerTotal').value) < 16 ) {
        cards.drawCard('bjDealer', 'dealerTotal');
    }

    let  draw = document.getElementById('draw');
    let  stay = document.getElementById('stay');
    let  reDeal = document.getElementById('reDeal');
    draw.disabled=true;
    stay.disabled=true;
    reDeal.style.visibility='visible';

    // when dealer is finished, call the determineWinner to see who wins
    determineWinner(parseInt( document.getElementById('dealerTotal').value), parseInt(document.getElementById('userTotal').value));
}

// Identify the winner and call the updateBank method to update score
const determineWinner = function (dealerTotal, playerTotal) {

    if (playerTotal > dealerTotal || dealerTotal > 21) {

        // User has blackjack
        if (isBlackjack()){
            document.getElementById('status').innerHTML = "Blackjack pays 3 to 2!";
            updateBank('bj');
        }
        // User just happened to win
        else {
            document.getElementById('status').innerHTML = "You win";
            updateBank('win');
        }
    }
    else if (playerTotal == dealerTotal){
        document.getElementById('status').innerHTML ="Push, fool";
    }
    else {
        document.getElementById('status').innerHTML ="You lose, chump";
        updateBank('lose');
    }
}

// See if user had blackjack
const isBlackjack = function () {

    let userCards = document.getElementById('bjCards').querySelectorAll('div.card');
    if (userCards.length == 2) {

        // Sort the users hand so numbers appear before face cards
        let hand = [];
        hand.push(userCards[0].getAttribute('class').split(' ')[1].split('-')[1].replace('a','z'));
        hand.push(userCards[1].getAttribute('class').split(' ')[1].split('-')[1].replace('a','z'));
        let playerHand = hand.sort().join('');

        // regex to see if 10 and face card
        return /[10jqk]z/.test(playerHand);
    }
    else {
        return false;
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

// Update the user account
const updateBank = function (status) {

    let bank = parseInt( sessionStorage.getItem("userBank"));
    let wager=parseInt(document.getElementById('wager').value);

    if (status == 'lose') {
        let newval = (bank -  wager).toString();
        sessionStorage.setItem("userBank", newval);
    }
    else if (status == 'win') {
        let newval = (bank  +  wager).toString();
        sessionStorage.setItem("userBank", newval);
    }

    else if (status == 'bj'){

        let newval = (bank  +  (wager*1.5)).toString();
        sessionStorage.setItem("userBank", newval);
    }
    document.getElementById('bank').value = parseInt( sessionStorage.getItem('userBank'));
}

// If user account goes below 100, set user account back to 1000
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

// Start the game by dealing 1 card to dealer and 2 for player
const deal = function () {
    if (parseInt(document.getElementById('wager').value) > 0){

        // replace the facecard
        document.getElementById('faceDown').style.visibility='visible';
            let node = document.getElementById('placeHolder');
            if (node.parentNode){
             node.parentNode.removeChild(node);
            }

        cards.startGame();
        document.getElementById('draw').disabled = false;
        document.getElementById('deal').disabled = true;
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

// populate the wager
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
        if (maxVal - parseInt(wager.value) >0) {
            bet = parseInt(wager.value) + 100;
        }
        else {
            bet=maxVal;
        }
    }
    wager.value = bet;

    document.getElementById('')
    document.getElementById('deal').disabled = false;
}

// Toggle the value of ace between 11 and 1
const changeAce = function (card) {

    let userCards = document.getElementById('bjCards').querySelectorAll('div.card');

    let newSum = 0;
    for(let i = 0;i<userCards.length;i++){
        if ( userCards[i].rank == card.rank && userCards[i].suit == card.suit){
            if (!userCards[i].isSoft) {
                userCards[i].value = 1;
                userCards[i].isSoft = true;
                userCards[i].classList.add('soft');
            }
            else{
                userCards[i].value = userCards[i].originalValue;
                userCards[i].classList.remove('soft');
                userCards[i].isSoft = false;

            }
        }
        newSum += userCards[i].value;
    }
    document.getElementById('userTotal').value = newSum;
}


// create a new instance of a deck of cards
var cards = new Cards();


