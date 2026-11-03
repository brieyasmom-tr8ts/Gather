// type: photo | answer | video | bonus. pts is the base value; judges can override.
window.HUNT_ITEMS = [
  { id: 1, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Team photo with the giant LEGO sea serpent in the water behind the LEGO Store.' },
  { id: 2, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Copy the pose of a LEGO statue outside the LEGO Store, whole team in matching poses.' },
  { id: 3, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Photo with the Coca-Cola polar bear on the second floor of the Coca-Cola Store.' },
  { id: 4, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Team pointing up at the Aerophile balloon while it\'s in the air.' },
  { id: 5, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'A car that swims: team photo with an Amphicar at The Boathouse dock.' },
  { id: 6, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Everybody roar: team photo with a dinosaur at T-Rex Cafe.' },
  { id: 7, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Team photo under the Rainforest Cafe volcano.' },
  { id: 8, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Strike a bowling pose outside Splitsville.' },
  { id: 9, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Team acrobat pose in front of the Cirque du Soleil theater.' },
  { id: 10, round: 'Photo hunt', pts: 5, kind: 'photo', text: 'Photo at the actual springs bubbling in Town Center. Yes, they\'re real, go find them.' },

  { id: 11, round: 'Find it and answer', pts: 10, kind: 'answer', text: 'Gideon\'s Bakehouse: photograph the menu board and type the name of the limited cookie flavor. The board outside counts, nobody has to survive that line.' },
  { id: 12, round: 'Find it and answer', pts: 10, kind: 'photo', text: 'Find Six Ravens, the new restaurant from the Gideon\'s creators, and photograph your team with its logo or mural.' },
  { id: 13, round: 'Find it and answer', pts: 10, kind: 'answer', text: 'Inside World of Disney: find a 2026 dated item (ornament, pin, or shirt) and photo it with the price. Type the price.' },
  { id: 14, round: 'Find it and answer', pts: 10, kind: 'answer', text: 'At Disney\'s Days of Christmas: find the ornament you\'d put on the GiveSendGo office tree and defend your choice.' },
  { id: 15, round: 'Find it and answer', pts: 10, kind: 'photo', text: 'Find something in GiveSendGo green anywhere in the Marketplace Co-Op. Closest color match wins a judge bonus.' },
  { id: 16, round: 'Find it and answer', pts: 10, kind: 'photo', text: 'Basin: whole team washes with the soap scrub at the sink station, photo mid-scrub.' },
  { id: 17, round: 'Find it and answer', pts: 10, kind: 'photo', text: 'Goofy\'s Candy Co: photo of the biggest candy in the store, with a teammate\'s face next to it for scale.' },
  { id: 18, round: 'Find it and answer', pts: 10, kind: 'answer', text: 'Team photo with the House of Blues water tower, plus name one artist whose folk art is on the building or in the Gear Shop.' },
  { id: 19, round: 'Find it and answer', pts: 10, kind: 'photo', text: 'Sprinkles: photo at the cupcake ATM. Actually buying one is between you and your conscience.' },
  { id: 20, round: 'Find it and answer', pts: 10, kind: 'photo', text: 'Find the Marketplace carousel and get one teammate on it, team waving in front. Small ticket cost, team\'s own money, big photo payoff.' },

  { id: 21, round: 'Video round', pts: 15, kind: 'video', text: 'Thirty seconds of your team singing a Disney chorus in front of World of Disney. Full commitment, no mumbling.' },
  { id: 22, round: 'Video round', pts: 15, kind: 'video', text: 'Slow-motion video of your team dramatically waving goodbye to a resort boat at the dock, like it\'s sailing away forever.' },

  { id: 23, round: 'Generosity round', pts: 20, kind: 'answer', text: 'The Cast Compliment: find a cast member, learn their name and hometown from their name tag, deliver a genuine thank-you, and type their first name and what they do. Photo only if they say yes.' },
  { id: 24, round: 'Generosity round', pts: 20, kind: 'video', text: 'With permission, ask a stranger to answer on video in one sentence: "What\'s the kindest thing someone has done for you?"' }
];
