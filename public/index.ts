let axios;

const state = {
  totalMachedCards: [],
  totalFlipsStatist: 0,
  totalTime: 60,
  matchedCards: [],
  cardsArray: [],
  timeRemaining: null,
  clickNumber: 0,
  seconds: 0,
  userID: [],
  playerID: "", 
  startGame: false,
};

const loadNewGame = async function loadgame() {
  const { pairedCardArray, lastLoggedInPlayer } = await getDeck();
  renderDeck(pairedCardArray);
  renderPlayer(lastLoggedInPlayer);
};

const loadPlayersList = async function loadgame() {
  const { players, lastLoggedInPlayer } = await getDeck();
  renderPlayerList(players);
  renderGeneralStatisticLastPlayer(lastLoggedInPlayer);
  showBestTime();
};

function handleToRegisterForm(): void {
  const formLogin: any = document.querySelector("#login");
  const formRegister: any = document.querySelector("#register");
  const registerLink: any = document.querySelector(".registerLink");
  const error: any = document.querySelector(".error");
  formRegister.style.display = "block";
  registerLink.style.display = "none";
  formLogin.style.display = "none";
  error.style.display = "none";
}

async function getDeck() {
  try {
    const { data } = await axios.post("/game/get-deck");
    const { pairedCardArray, players, lastLoggedInPlayer } = data;
    state.playerID = lastLoggedInPlayer.playerID;
    state.userID.push(state.playerID);
    return data;
  } catch (error) {
    console.error(error);
  }
}

async function handleRegester(e: any) {
  try {
    e.preventDefault();
    let { name, password } = e.target.elements;
    name = name.value;
    password = password.value;
    const { data } = await axios.post("/game/player-add", { name, password });
    const { players } = data;
    window.location.href = "./game.html";
    e.target.reset();
  } catch (error) {
    console.error(error);
  }
}

async function handleLogin(e: any) {
  try {
    e.preventDefault();
    const name = e.target.elements.name.value;
    const password = e.target.elements.password.value;
    console.log(name, password);
    const { data } = await axios.get(
      `/game/check-if-exist?name=${name}&password=${password}`
    );
    const { filteredPlayers } = data;
    e.target.reset();

    if (filteredPlayers.length > 0) {
      window.location.href = "./game.html";
    } else {
      document.querySelector<HTMLElement>("#loginPage").innerHTML = `
     <div class="loginPageContainer__userLoginError">
        <p class="error" >Sorry, the player <span style="color: rgb(163, 38, 24);"   </span> ${name}  </span> is not exist yet, please register first</p>
        <p class="registerLink" onclick="handleToRegisterForm()">If you are not a member, there is 
        <span style="text-decoration: underline; cursor: pointer"> one more step to do</span></p>
     </div>
     `;
    }
  } catch (error) {
    console.error(error.message);
  }
}

const handleStartGame = () => {
  try {
    const winningMessage: HTMLElement =
      document.querySelector("#winningMessage");
    state.totalFlipsStatist++;
    state.totalTime = 60;
    resetAll();
    startMusic();
    pulse();

    state.startGame = true;

    state.timeRemaining = setInterval(() => {
      let timer: any = document.querySelector("#time-remaining");
      state.totalTime--;
      timer.innerText = `${state.totalTime}`;

      if (state.totalTime === 0) {
        clearInterval(state.timeRemaining);
        gameOver();
      }

      state.seconds++;
      const timeStatist = state.seconds;

      const updateTime = async (playerID: string) => {
        try {
          console.log(playerID);
          if (!playerID) throw new Error("no playerID");
          const { data } = await axios.put("/game/player-time-update", {
            timeStatist,
          });
          const { lastLoggedInPlayer, error } = data;
        } catch (error) {
          console.error(error);
          console.error(error.message);
        }
      };
      updateTime(state.userID[0]);
    }, 1000);

    winningMessage.classList.remove("show");
  } catch (error) {
    console.error(error.message);
  }
};

const handleFlipCard = (e: any, playerID: string) => {
  try {
    if (!state.startGame) {
      return;
    }
    const element = e.currentTarget;
    state.clickNumber++;
    flipMusic();
    const ticker: any = document.querySelector("#flips");
    state.totalFlipsStatist++;
    ticker.innerText = `${state.totalFlipsStatist}`;
    const totalFlip = ticker.innerText;

    const updateFlips = async (playerID: string) => {
      try {
        if (!playerID) throw new Error("no playerID");
        const { data } = await axios.put("/game/player-flips-update", {
          totalFlip,
        });
        const { lastLoggedInPlayer, error } = data;
      } catch (error) {
        console.error(error);
        console.error(error.message);
      }
    };
    updateFlips(state.userID[0]);

    if (state.clickNumber <= 2) {
      if (element.className === "game__containerGame__card") {
        if (element.style.transform === "rotateY(180deg)") {
          element.style.transform = "rotateY(0deg)";
        } else {
          element.style.transform = "rotateY(180deg)";
          state.matchedCards.push(element);

          if (state.clickNumber === 2) {
            const checkMatch = async () => {
              const { data } = await axios.get(
                `/game/check-match?card1=${state.matchedCards[0].id}&card2=${state.matchedCards[1].id}`
              );

              if (data == true) {
                state.matchedCards[0].style.opacity = "0";
                state.matchedCards[1].style.opacity = "0";
                matchSound();
                state.totalMachedCards.push(state.matchedCards);
                winStateCheck();
              }
            };
            checkMatch();
          } else {
            state.cardsArray.push(element);
          }
        }
      }
    } else {
      flipBackUnPairedCards();
      state.clickNumber = 0;
    }
  } catch (error) {
    console.error(error.message);
  }
};

function flipBackUnPairedCards() {
  const cards: any = document.querySelectorAll(".game__containerGame__card");
  Array.from(cards).forEach(function (card) {
    //@ts-ignore
    card.style.transform = "rotateY(0deg)";
    state.matchedCards = [];
  });
}

async function handleSelectPlayer(e: any, playerID: string) {
  let target = e.currentTarget;
  const { data } = await axios.post("/game/get-player-by-id", { playerID });
  let { player, index } = data;
  const statisticRoot = document.querySelector("#statisticRoot");
  let playerhtml = "";
  playerhtml += `  
               <h3 class="generalStatisticContainer__generalStatistic__innerTitle" ${player[index].playerID}><span class="material-icons user-icon">psychology</span>&nbsp;Name&nbsp;: &nbsp;&nbsp;&nbsp;&nbsp; 
               <span style="color:rgba(130, 29, 18, 0.691);">${player[index].name}</span></h3>
            <div class="generalStatisticContainer__generalStatistic__info-time" ${player[index].playerID}>
              <div class="generalStatisticContainer__generalStatistic__gen-stat-inner">               
                 <p>Time&nbsp;: <span style="color: rgba(130, 29, 18, 0.691); font-weight: bold;"></span></p>
              </div>
                 <p style="color: rgba(130, 29, 18, 0.691); font-weight: bold; font-size: 1.3em;">${player[index].timeStatist}</p>
            </div>  

            <div class="generalStatisticContainer__generalStatistic__info-flips" ${player.playerID}>
              <div class="generalStatisticContainer__generalStatistic__gen-stat-inner">                
                 <p>Flips&nbsp;:</p>
              </div> 
                <p style="color: rgba(130, 29, 18, 0.691); font-weight: bold; font-size: 1.3em;">${player[index].totalFlip}</p>
            </div>  
    `;
  statisticRoot.innerHTML = playerhtml;
}

async function showBestTime() {
  try {
    const { data } = await axios.post("/game/best-time");
    const { minTime } = data;
    const bestTime = document.querySelector("#bestTime");
    let html = "";
    html += `
      <p><span class="material-icons user-icon">flag_circle</span>&nbsp;&nbsp;Best time score is &nbsp;:&nbsp;  
      <span style="color: rgba(130, 29, 18, 0.691); font-weight: bold; font-size: 2rem;">${minTime}</span></p>
       `;
    bestTime.innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

function renderDeck(pairedCardArray): void {
  const root = document.querySelector("#root");
  let html = "";
  pairedCardArray.forEach((obj) => {
    html += `
        <div class="game__containerGame__card" onclick="handleFlipCard(event, '${obj.playerID}')" id="${obj.cardID}" >
              <img class="game__containerGame__card__back game__containerGame__card__face" id="${obj.cardID}" src="./styles/img/back.jpg">       
              <img class="game__containerGame__card__front game__containerGame__card__face" id="${obj.cardID}" src="${obj.url}">           
        </div>
        `;
  });
  root.innerHTML = html;
}

function renderPlayer(lastLoggedInPlayer): void {
  const playerRoot = document.querySelector("#playerRoot");
  let html = "";
  html += `<span class="material-icons user-icon">psychology</span> 
           <p style="font-size: .7em;" ${lastLoggedInPlayer.playerID}>playing now: <span style="color:rgba(130, 29, 18, 0.591); font-size: 1.1em; font-weight: bold;">${lastLoggedInPlayer.name}</span></p>`;
  playerRoot.innerHTML = html;
}

function renderGeneralStatisticLastPlayer(lastLoggedInPlayer): void {
  const statisticRoot = document.querySelector("#statisticRoot");
  let html = "";
  html += ` 
                <h3 class="generalStatisticContainer__generalStatistic__innerTitle" ${lastLoggedInPlayer.playerID}><span class="material-icons user-icon">psychology</span>&nbsp;Name&nbsp;: &nbsp;&nbsp;&nbsp;&nbsp; <span style="color:rgba(130, 29, 18, 0.691);">${lastLoggedInPlayer.name}</span></h3>
            <div class="generalStatisticContainer__generalStatistic__info-time" ${state.playerID}>
              <div class="generalStatisticContainer__generalStatistic__gen-stat-inner">               
                 <p>Time&nbsp;: <span style="color: rgba(130, 29, 18, 0.691); font-weight: bold; font-size: 1em; "></span></p>
              </div>
                 <p style="color: rgba(130, 29, 18, 0.691); font-weight: bold; font-size: 1.3em;">${lastLoggedInPlayer.timeStatist}</p>
            </div>  

            <div class="generalStatisticContainer__generalStatistic__info-flips" ${state.playerID}>
              <div class="generalStatisticContainer__generalStatistic__gen-stat-inner">                
                 <p>Flips&nbsp;:</p>
              </div> 
                <p style="color: rgba(130, 29, 18, 0.691); font-weight: bold; font-size: 1.3em;">${lastLoggedInPlayer.totalFlip}</p>
            </div>         
        `;
  statisticRoot.innerHTML = html;
}

function renderPlayerList(players): void {
  const playersList = document.querySelector("#playersListRoot");
  let playerhtml = "";
  players.forEach((player) => {
    playerhtml += `  
        <div class="playersListContainer__playersList__playersList-inner">
          <span class="material-icons user-icon">psychology</span>&nbsp;
          <p class="playersListContainer__playersList__playersList-inner__generalStatisicPlayerList" onclick="handleSelectPlayer(event,'${player.playerID}', '${player.name}', '${player.timeStatist}', '${player.totalFlip}')">Player&nbsp;: 
          <span style="color: rgba(130, 29, 18, 0.691);  font-weight: bold; cursor: pointer;">&nbsp;${player.name}</span>
          </p> 
        </div>
    `;
  });
  playersList.innerHTML = playerhtml;
}

const winStateCheck = () => {
  if (state.totalMachedCards.length == 8) {
    victory();
  }
};

const gameOver = (): void => {
  state.totalFlipsStatist = 0;
  state.totalTime = 0;
  gameOverSound();
  stopMusic();
  hideCards();
  drawMessage();
};

const victory = (): void => {
  state.totalFlipsStatist = 0;
  state.totalTime = 0;
  victorySound();
  stopMusic();
  hideCards();
  clearInterval(state.timeRemaining);
  winMessage();
};

function hideCards() {
  const deck = document.querySelector(".game__containerGame");
  while (deck.hasChildNodes()) {
    deck.removeChild(deck.firstChild);
  }
}

function resetAll() {
  state.totalFlipsStatist = 0;
  state.clickNumber = 0;
  stopMusic();
  loadNewGame();
  clearInterval(state.timeRemaining);
}

const handleRestartGame = () => {
  try {
    const winningMessage: HTMLElement = document.querySelector("#winningMessage");
    document.querySelector<HTMLElement>(".game__titleGame").style.display = "block";
    winningMessage.classList.remove("show");
    window.location.reload();
    return false;
    state.totalFlipsStatist = 0;
    state.clickNumber = 0;
    handleStartGame();
  } catch (error) {
    console.error(error.message);
  }
};

function winMessage(): void {
  const winningMessage: HTMLElement = document.querySelector("#winningMessage");
  document.querySelector<HTMLElement>(".game__titleGame").style.display = "none";
  winningMessage.innerHTML = `CONGRATS! <br> You Win!
                                <img style ="width: 300px; padding-top: 2.5%; padding-bottom: 1.5%;" src="./styles/img/queen.png"></img>
                              <div class="message-buttons"> 
                                <button class="statisticBtn" id="restartButton" onclick="handleRestartGame()">Restart</button>
                                <button class="statisticBtn" onclick="handleToGeneralStatistic()">Statistics</button>
                              </div> 
                                `;
  winningMessage.classList.add("show");
}

function drawMessage(): void {
  const winningMessage: HTMLElement = document.querySelector("#winningMessage");
  document.querySelector<HTMLElement>(".game__titleGame").style.display = "none";
  winningMessage.innerHTML = `Game Over :( <br> Next time surely..!
                                <img src="./styles/img/joker.png"></img>
                              <div class="message-buttons">
                                <button class="statisticBtn" id="restartButton" onclick="handleRestartGame()">Restart</button>
                                <button class="statisticBtn" onclick="handleToGeneralStatistic()">Statistics</button>
                              </div> 
                                `;
  winningMessage.classList.add("show");
}

function gameOverSound(): void {
  const gameOver: any = document.querySelector("#gameOver");
  gameOver.volume = 0.2;
  gameOver.play();
}

function victorySound(): void {
  const victory: any = document.querySelector("#victory");
  victory.volume = 0.2;
  victory.play();
}

function startMusic(): void {
  const bgMusic: any = document.querySelector("#creepy");
  bgMusic.play();
  bgMusic.volume = 0.2;
  bgMusic.loop = true;
}

function stopMusic(): void {
  const bgMusic: any = document.querySelector("#creepy");
  bgMusic.pause();
}

function flipMusic(): void {
  const flip: any = document.querySelector("#flip");
  flip.play();
  flip.volume = 0.2;
}

function matchSound(): void {
  const match: any = document.querySelector("#match");
  match.play();
  match.volume = 0.1;
}

function handleToGeneralStatistic(): void {
  window.location.href = "./statistic.html";
}

function handleBackToGame(): void {
  window.location.href = "./game.html";
}

function handleBackToLogin(): void {
  window.location.href = "./index.html";
}

function pulseLogin(): void {
  setInterval(() => {
    setTimeout(() => {
      document.querySelector<HTMLElement>(".loginPageContainer__title__smilyImg").style.transform = "scale(1.5)";
      document.querySelector<HTMLElement>(".loginPageContainer__title__smilyImg").style.transition = "all 4s ease";
    }, 4000);
    setTimeout(() => {
      document.querySelector<HTMLElement>(".loginPageContainer__title__smilyImg").style.transform = "scale(1.0)";
      document.querySelector<HTMLElement>(".loginPageContainer__title__smilyImg").style.transition = "all 4s ease";
    }, 6000);
  }, 15000);
}

function pulseGame(): void {
  setInterval(() => {
    setTimeout(() => {
      document.querySelector<HTMLElement>(".game__titleGame__smilyImgGame").style.transform = "scale(1.5)";
      document.querySelector<HTMLElement>(".game__titleGame__smilyImgGame").style.transition = "all 4s ease";
    }, 4000);
    setTimeout(() => {
      document.querySelector<HTMLElement>(".game__titleGame__smilyImgGame").style.transform = "scale(1.0)";
      document.querySelector<HTMLElement>(".game__titleGame__smilyImgGame").style.transition = "all 4s ease";
    }, 6000);
  }, 15000);
}

function pulseStatistic(): void {
  setInterval(() => {
    setTimeout(() => {
      document.querySelector<HTMLElement>(".generalStatisticContainer__title__smilyImgStatistic").style.transform = "scale(1.5)";
      document.querySelector<HTMLElement>(".generalStatisticContainer__title__smilyImgStatistic").style.transition = "all 4s ease";
    }, 4000);
    setTimeout(() => {
      document.querySelector<HTMLElement>(".generalStatisticContainer__title__smilyImgStatistic").style.transform = "scale(1.0)";
      document.querySelector<HTMLElement>(".generalStatisticContainer__title__smilyImgStatistic").style.transition = "all 4s ease";
    }, 6000);
  }, 12000);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function pulse() {
  const clockIcon: any = document.querySelector(".clock");
  const clock = setInterval(() => {
    setTimeout(() => {
      clockIcon.style.opacity = 0;
      clockIcon.style.transition = "1s ease-in-out";
    }, 1000);

    setTimeout(() => {
      clockIcon.style.opacity = 1;
      clockIcon.style.transition = "1s ease-in-out";
    }, 2000);
  }, 2000);
}


