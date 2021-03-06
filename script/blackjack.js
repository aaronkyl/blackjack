function Card(suit, name, value) {
    this.suit = suit;
    this.name = name;
    this.value = value;
    this.faceup = true;
    
    this.imageSRC = function() {
        if (this.faceup) {
            return `img/${this.name}_of_${this.suit}.png`;
        } else {
            return "img/card_back.svg";
        }
    };
    
    this.drawCardImage = function() {
        if (this.faceup) {
            return `<img class="card" src="${this.imageSRC()}" alt="${this.name} of ${this.suit}">`;
        } else {
            return `<img class="card" src="${this.imageSRC()}" alt="Unrevealed card">`;
        }
        
    };
}

function Deck(noOfDecks) {
    this.suits = ["hearts", "spades", "diamonds", "clubs"];
    this.names = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    this.cards = [];
    var that = this;
    
    // initialize deck with 52 cards * noOfDecks
    for(var i = 0; i < noOfDecks; i++) {
        that.suits.forEach(function(suit) {
            that.names.forEach(function(name, value) {
                if (!isNaN(name)) {
                    that.cards.push(new Card(suit, name, value+1));
                } else if (name == "ace") {
                    that.cards.push(new Card(suit, name, 11));
                    that.cards[that.cards.length-1].aceIsOne = function() {
                        this.value = 1;
                        return;
                    };
                } else {
                    that.cards.push(new Card(suit, name, 10));
                }
            });
        });
    }
    
    this.shuffle = function() {
        for (var i = 0, l = that.cards.length; i < 1000; i++) {
            let card1Index = Math.floor(Math.random() * l);
            let card2Index = Math.floor(Math.random() * l);
            let temp = that.cards[card1Index];
            that.cards[card1Index] = that.cards[card2Index];
            that.cards[card2Index] = temp;
        }
        return;
    };
    
    this.isEmpty = function() {
        return !this.cards.length;
    };
}

function Hand(id) {
    this.id = id;
    this.cards = [];
    this.value = 0;
    this.wins = 0;
    this.bust = false;
    var that = this;
    
    this.drawCard = function(deck, faceup = true) {
        if (deck.isEmpty()) {
            // modal about deck being empty, start new game?
        }
        // get card
        let card = deck.cards.splice(that.cards.length - 1, 1)[0];
        if (this.id == "dealer" && this.cards.length == 0) {
            card.faceup = false;
        }
        // add card to hand
        that.cards.push(card);
        // add card to displayed hand on table
        $(`#${that.id}-hand`).append(card.drawCardImage());
        return;
    };
    
    this.checkBust = function() {
        if (that.value > 21) {
            let ace11InHand = that.cards.findIndex(c => c.name == "ace" && c.value == 11);
            if (ace11InHand + 1) {
                that.cards[ace11InHand].aceIsOne();
                that.calculatePoints();
                return that.checkBust();
            }
            $("#messages").text(`${that.id.toUpperCase()} BUSTS!`);
            $(`#${that.id}-points`).css("color", "#F00");
            that.bust = true;
            return true;
        }
        return false;
    };
    
    this.calculatePoints = function() {
        let shownPoints = that.cards.map(function(card) {
            if (card.faceup) {
                return card.value;
            } else {
                return 0;
            }
        });
        that.value = shownPoints.reduce(function(sum, cur) {
            return sum + cur;
        }, 0);
        // update displayed hand total with new total
        $(`#${that.id}-points`).text(that.value);
        that.checkBust();
        return;
    };
}

$(document).ready(function() {
    var noOfDecks = 1;
    
    $("#settings-btn").click(function() {
        $("#settings-window").slideToggle("fast");
    });
    $("#settings-close-btn").click(function() {
        $("#settings-window").slideToggle("fast");
    })
    $("#info-btn").click(function() {
        $("#info-window").slideToggle("fast");
    });
    $("#info-close-btn").click(function() {
        $("#info-window").slideToggle("fast");
    });
    
    $("#shuffle-btn").click(function() {
        deck = new Deck(noOfDecks);
        deck.shuffle();
        dealer = new Hand("dealer");
        player = new Hand("player");
        playersTurn = true;
        $(".hand").empty();
        $(".points").css("color", "");
        $(".points").empty();
        $("#messages").empty();
        $(".wins").text(0);
        $("#hit-button").dither();
        $("#stand-button").dither();
        $("#deal-button").undither();
    });
    
    $(".button span").click(function() {
        var tableColor = $(this).css("background-color");
        $("#table").css("background-color", tableColor);
    });
    
    $('input[name="decks"] ~ label').click(function() {
        noOfDecks = $(this).text();
        $('input[name="decks"] ~ label').css("color", "rgba(255, 255, 255, .5)")
        $(this).css("color", "white");
    });
    
    // initialize game
    var deck = new Deck(noOfDecks);
    deck.shuffle();
    var dealer = new Hand("dealer");
    var player = new Hand("player");
    var playersTurn = true;
    $("#hit-button").dither();
    $("#stand-button").dither();
    $("#deal-button").undither();
    [player, dealer].forEach(function(e) {
        $(`#${e.id}-wins`).text(`${e.wins}`);
    });
    
    var handWon = function(winner) {
        winner.wins++;
        $("#hit-button").dither();
        $("#stand-button").dither();
        $("#deal-button").undither();
    };
    
    var dealerWon = function() {
        return (playersTurn && player.bust) || dealer.value == 21 || (!playersTurn && !dealer.bust && dealer.value > player.value);
    };
    
    var playerWon = function() {
        return dealer.bust || player.value == 21 || (!playersTurn && dealer.value >= 17 && player.value > dealer.value);
    };
    
    var checkForWinner = function() {
        let winner = false;
        if (dealerWon()) {
            winner = dealer;
        } else if (playerWon()) {
            winner = player;
        } else if (!playersTurn && player.value == dealer.value) {
            $('#messages').text("DRAW");
            $("#hit-button").dither();
            $("#stand-button").dither();
            $("#deal-button").undither();
            return true;
        } else {
            return winner;
        }
        $('#messages').text(`${winner.id.toUpperCase()} WON!`);
        revealDealerCards();
        handWon(winner);
        $(`#${winner.id}-wins`).text(`${winner.wins}`);
        return;
    };
    
    var revealDealerCards = function() {
        dealer.cards[0].faceup = true;
        $('#dealer-hand img:first-child').attr("src", dealer.cards[0].imageSRC());
        dealer.calculatePoints();
    };
    
    // clear hands and deal a hand of two cards each to player and dealer
    $('#deal-button').click(function() {
        // reset table for next hand
        $(".hand").empty();
        $(".points").css("color", "");
        $(".points").empty();
        $("#messages").empty();
        playersTurn = true;
        $("#hit-button").undither();
        $("#stand-button").undither();
        $("#deal-button").dither();
        
        if (deck.cards.length >= 4) {
            [player, dealer].forEach(function(e) {
                // clear hand
                e.cards = [];
                e.bust = false;
                // deal two cards
                for(var i = 0; i < 2; i++) {
                    e.drawCard(deck);
                }
                e.calculatePoints();
            });
            checkForWinner();
        } else {
            $('#messages').text("Deck does not have enough cards to deal. Click SHUFFLE!");
        }
    });
    
    $('#hit-button').click(function() {
        if (deck.isEmpty()) {
            $('#messages').text("Deck is out of cards! Click Stand to see who won!");
            return;
        } else {
            player.drawCard(deck);
            player.calculatePoints();
            checkForWinner();
        }
    });
    
    $('#stand-button').click(function() {
        playersTurn = false;
        revealDealerCards();
        while((dealer.value <= player.value) && dealer.value < 17 && !deck.isEmpty()) {
            dealer.drawCard(deck);
            dealer.calculatePoints();
        }
        checkForWinner();
    });
})