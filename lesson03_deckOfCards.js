

window.addEventListener('load',function(){

    // Bind eventhandlers to controls
    document.getElementById('deal').addEventListener("click", deal);
    document.getElementById('draw').addEventListener('click',draw);
    document.getElementById('reDeal').addEventListener('click',dealAgain);
    document.getElementById('stay').addEventListener('click',dealerShouldDraw);
    document.getElementById('wager').addEventListener('input',checkWager);
    document.getElementById('borrow').addEventListener('click',getCredit);

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

    // Inialize the table
    init();
});

/*=============================================================================
| Initialize the card table - welcome message, establish the users credit,
| ensure the user has enough money to sit at the table
 ==============================================================================*/
const init = function () {

    let id = sessionStorage.getItem("uid");
    if (id === null) {
        let uid= window.prompt('Enter your user name: ','Player1');
        sessionStorage.setItem("uid",uid);
    }

    document.getElementById('playerName').innerHTML = sessionStorage.getItem("uid");

    setMessage('Make a wager to start the action');
    let bank = parseInt(createAccount());
    isUserBroke(bank);
}

/*=============================================================================
| Card - constructor for Card object
| Args: cssClass - class to render each card
|       rank -  character value of the card
|       suit -  suit of the card
| Return Card object
 ==============================================================================*/
const Card = function(cssClass,rank,suit){
    
    this.cssClass=cssClass;
    this.rank = rank;
    this.suit = suit;

    // Add the ace class to enable the toggle from 1 -11 functionality
    if (rank == 'a'){
        this.cssClass = cssClass +  " ace";
    }

    // calculate numeric value of the card
    const face = {'j':10,'q':10,'k':10,'a':11};
    this.value = isNaN(rank) ?  face[rank] : parseInt(rank);
    this.originalValue = isNaN(rank) ?  face[rank] : parseInt(rank);

    // Aces are 11 by default
    this.isSoft = false;
}


/*=============================================================================
| Cards collection object
 ==============================================================================*/
const Cards = function () {

    // Holds the array of card objects
    this.deck = [];
    this.currentDeck= [];

    /*-------------------------------------------------------------------------
    | getDeck - Create a complete deck of cards and current deck to manage cards that
    | have already been dealt to prevent reselection
    ---------------------------------------------------------------------------*/
    this.getDeck = function () {

        // data for deck of cards
        const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
        const suits = ['diams', 'hearts', 'spades', 'clubs'];

        // Create the complete deck of cards
        for (let s of suits) {
            for (let c of cards) {
                // Call the card constructor
                let card = new Card(`card rank-${c} ${s}`, c, s);

                // Add card to the complete deck
                this.deck.push(card);
            }
        }
        // Used cards
        this.currentDeck = [...this.deck];
    }

    /*-------------------------------------------------------------------------
    | drawCard - Deal a single card and remove from the current deck
    ---------------------------------------------------------------------------*/
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

    /*-------------------------------------------------------------------------
    | startGame - deals a hand to dealer and player
    ---------------------------------------------------------------------------*/
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

            // If 2 aces are dealt, second is automatically soft
            if (i==1){
                if (userTotal + ucard.value > 21){
                    ucard.isSoft=true;
                    ucard.cssClass=ucard.cssClass + ' soft';
                    ucard.value = 1;
                }
            }
            this.addCardToUI('bjCards', ucard);
            userTotal += ucard.value;
        }

        document.getElementById('userTotal').value = userTotal;

        // If user has blackjack stop game and pay
        if (isBlackjack()){
            setMessage( "You Win - Blackjack pays 3:2!!!");
            updateBank('bj');
            document.getElementById('deal').style.display ='none';
            document.getElementById('draw').style.display ='none';
            document.getElementById('stay').style.display = 'none';
            document.getElementById('reDeal').style.visibility='visible';
        }
        else {
            checkValue('userTotal');
            setMessage('Click <i class="fa fa-hand-o-down" aria-hidden="true"></i> to hit, or <i class="fa fa-hand-paper-o" aria-hidden="true"></i></button> to see the dealer\'s hand');
        }
    }

    /*-------------------------------------------------------------------------
    | getRandomCard - select and remove a random card from the current deck
    | returns: Random Card object
    ---------------------------------------------------------------------------*/
    this.getRandomCard = function () {
        let pos = Math.floor(Math.random() * this.currentDeck.length - 1);
        return this.currentDeck.splice(pos, 1)[0];
    }

    /*-------------------------------------------------------------------------
    | addCardToUI - append a card to the players hand
    | Args:
    |     target- div that contains the players cards
    |     card -  Card object
    ---------------------------------------------------------------------------*/
    this.addCardToUI = function (target,card) {

        let hand = document.getElementById(target);
        let cardDiv = document.createElement('DIV');

        // Bind datapoint to the
        Object.assign(cardDiv,{value:card.value,rank:card.rank,suit:card.suit,isSoft:card.isSoft,originalValue:card.originalValue});

        cardDiv.setAttribute('class',card.cssClass);

        // Add instructions for aces in the players hand
        if (card.rank=='a' && target =='bjCards'){
            cardDiv.setAttribute('title','Click to toggle the value of Ace between 1 and 11');
        }

        // Create the rank span
        let cardRank =document.createElement('span');
        cardRank.setAttribute('class','rank');
        cardRank.innerHTML= card.rank ;
        cardDiv.appendChild(cardRank);

        // Create the suit span
        let cardSuit =document.createElement('span');
        cardSuit.setAttribute('class','suit');
        cardSuit.innerHTML=`&${card.suit};`;
        cardDiv.appendChild(cardSuit);

        // add eventhandler to toggle aces between 1 - 11
        cardDiv.addEventListener('click',function () {
            changeAce(card);
        });

        hand.appendChild(cardDiv);
    }
}

/*=============================================================================
| checkValue - Check the sum of the cards after each card is dealt. If an ace
| caused the player to bust, toggle soft ace
| Args:
|   target - input element that holds the player score
 ==============================================================================*/
const checkValue = function(target){

    let cardTray = target == 'userTotal' ? 'bjCards' : 'bjDealer';

    let  draw = document.getElementById('draw');
    let  stay = document.getElementById('stay');
    let  reDeal = document.getElementById('reDeal');
    let val  = document.getElementById(target).value;

    // Convert hard aces to soft to prevent bust
    if (val > 21){
        checkForAcesInBust(target,cardTray);
    }

    // Reevaluate value after fixing aces
    val  = document.getElementById(target).value;
    // If player busts
    if (val >  21){

        draw.disabled=true;
        stay.disabled=true;
        reDeal.style.visibility='visible';

        // Display outcome message and update the account
        if (target == 'userTotal') {
            setMessage('Busted <i class=\"fa fa-frown-o\" aria-hidden=\"true\"></i>');
            updateBank('lose');
        }
        else{
            setMessage('Dealer busts, you win! <i class="fa fa-smile-o" aria-hidden="true"></i>');
            updateBank('win');
        }
    }
}

/*=============================================================================
| CheckForAcesInBust - toggle aces to 1 if player busts after drawing ace
| Args:
|   target - input element that holds the player score
|   cardtray - div that contains the players cards
 ==============================================================================*/
const checkForAcesInBust = function (target,cardTray) {
    let hand = document.getElementById(cardTray).querySelectorAll('div.card');
    let total = document.getElementById(target);

    let newSum = 0;
    // Find the card in the users hand by suit and rank
    for (let i = 0; i < hand.length; i++) {
        if (hand[i].value == 11) {

            // toggle to soft state
            hand[i].value = 1;
            hand[i].isSoft = true;
            hand[i].classList.add('soft');
        }
        // Recalulcate the new sum and update the player total
        newSum += hand[i].value;
    }
    total.value = newSum;
}

/*=============================================================================
| draw - Calls the draw method on the cards object
 ==============================================================================*/
const draw = function () {
    cards.drawCard('bjCards','userTotal');
}

/*=============================================================================
| dealerShouldDraw - draws cards for the dealer while the dealsers scores is <17
 ==============================================================================*/
const dealerShouldDraw = function () {
    // Flip over the facedown card
    let dealer = document.getElementById('bjDealer');
    let elem = document.getElementById('faceDown');
    document.getElementById('deal').disabled = 'true';
    elem.parentNode.removeChild(elem);

    // Dealer hits <= 16 logig
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

/*=============================================================================
| determineWinner - Identify the winner, extra payout for BJ, call notification
| Args:
|   dealerTotal - numeric score of dealer
|   playerTotal - numeric score of player
 ==============================================================================*/
const determineWinner = function (dealerTotal, playerTotal) {

    // Player Wins
    if (playerTotal > dealerTotal || dealerTotal > 21) {

        // See if the user has blackjack
        if (isBlackjack()){
            setMessage( "You Win - Blackjack pays 3:2!!!");
            updateBank('bj');
        }
        // User just happened to win
        else {
            setMessage( "You win");
            updateBank('win');
        }
    }
    // Push
    else if (playerTotal == dealerTotal){
        setMessage("Push");
    }
    // Player loses
    else {
        setMessage("You lose");
        updateBank('lose');
    }
}

/*=============================================================================
| isBlackJack - determine if the player has blackjack
| Returns: bool
 ==============================================================================*/
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

/*=============================================================================
| dealAgain - reset environment
 ==============================================================================*/
const dealAgain = function () {
    location.reload();
}


/*=============================================================================
| checkWager - user cannot bet more than value of account
 ==============================================================================*/
const checkWager = function () {
    let wager = document.getElementById('wager');
    let bank = document.getElementById('bank');

    wager.max  = parseInt( bank.value);
}

/*=============================================================================
| updateBank - update the users account based on outcome of game and wager
| args:
|   status - result of the game; win, lose, or bj
 ==============================================================================*/
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

/*=============================================================================
| getCredit - deposit 1000 in users account
 ==============================================================================*/
const getCredit = function () {
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

/*=============================================================================
| deal - move game into active play state after user makes a wager
 ==============================================================================*/
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

/*=============================================================================
| makeBet - Manage acoount based on amount user wagers
| Args:
|    amount - player wager amount
 ==============================================================================*/
const makeBet = function (amount) {

    let wager = document.getElementById('wager');
    let maxVal = parseInt(document.getElementById('bank').value);
    let bet;

    // half of the available money
    if (amount == 0.5){
        bet = Math.round(maxVal * .5)
    }
    // Max bet
    else if (amount == 1){
        bet=maxVal;
    }
    // add 100 until the wager exceeds the bank
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
    setMessage('Click <i class=\"fa fa-hand-o-up\" aria-hidden=\"true\"></i> to deal the cards');
}

/*=============================================================================
| changeAce- toggles the value of an ace from 1 - 11, unless doing so would cause
|            player to bust. Soft aces are identified with yellow border
| Args:
|   card - card object
 ==============================================================================*/
const changeAce = function (card) {

    // if the card is an ace
    if (card.rank =='a') {
        let userCards = document.getElementById('bjCards').querySelectorAll('div.card');
        let total = document.getElementById('userTotal');
        let newSum = 0;
        // Find the card in the users hand by suit and rank
        for (let i = 0; i < userCards.length; i++) {
            if (userCards[i].rank == card.rank && userCards[i].suit == card.suit) {

                // If the card is not soft, toggle to soft state
                if (!userCards[i].isSoft) {
                    userCards[i].value = 1;
                    userCards[i].isSoft = true;
                    userCards[i].classList.add('soft');
                // If the card is soft toggle back to the original state if total doesnt exceed 21
                } else {
                    if (parseInt(total.value ) + 10 <= 21) {
                        userCards[i].value = userCards[i].originalValue;
                        userCards[i].classList.remove('soft');
                        userCards[i].isSoft = false;
                    }
                }
            }
            // Recalulcate the new sum and update the player total
            newSum += userCards[i].value;
        }
        total.value = newSum;
    }
}

/*=============================================================================
| setMessage - displays a message to the user
| Args:
|   msg - HTML string to display
 ==============================================================================*/
const setMessage = function (msg) {
    document.getElementById('status').innerHTML=msg;
}

/*=============================================================================
| CreateAccount - establish sessionStorage to track the players account
| Returns: sessionStorage object
 ==============================================================================*/
const createAccount = function () {
    let ss = sessionStorage.getItem("userBank");
    if (ss == "NaN" || ss === null) {
        sessionStorage.setItem("userBank", "1000");
    }
    // Set the users available bank
    document.getElementById('bank').value = parseInt( sessionStorage.getItem("userBank"));
    return ss;
}

/*=============================================================================
| isUserBroke - make sure the user has enough money to sit at the table
| Args:
|  ss - sessionStorage object
 ==============================================================================*/
const isUserBroke = function (ss) {
    if (ss < 100) {
        document.getElementById('draw').disabled = true;
        document.getElementById('stay').disabled = true;
        document.getElementById('reDeal').disabled = true;
        document.getElementById('borrow').style.visibility = 'visible';
    }
}

/*=============================================================================
| Create an instance of a deck of cards
 ==============================================================================*/
var cards = new Cards();
cards.getDeck();



// Testing cards
// let a = new Card('card rank-a','a','diams');
// this.addCardToUI('bjCards', a);
// userTotal += a.value;