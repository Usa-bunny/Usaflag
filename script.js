"use strict";

const btn = document.querySelector(".btn-country");
const countriesContainer = document.querySelector(".countries");
const imgContainer = document.querySelector(".images");

// https://restcountries.com/v2/name/indonesia
// https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}

function renderCountry(data, className = "") {
  const html = `
        <article class="country ${className}">
          <img class="country__img" src="${data.flags.png}" />
          <div class="country__data">
            <h3 class="country__name">${data.name}</h3>
            <h4 class="country__region">${data.region}</h4>
            <p class="country__row"><span>👫</span>${data.population.toLocaleString(`${data.languages[0].iso639_1}`)} people</p>
            <p class="country__row"><span>🗣️</span>${data.languages[0].name}</p>
            <p class="country__row"><span>💰</span>${data.currencies[0].name}</p>
          </div>
        </article>
    `;

  countriesContainer.insertAdjacentHTML("beforeend", html);
  countriesContainer.style.opacity = 1;
}

function renderError(message) {
  countriesContainer.insertAdjacentText("beforeend", message);
  countriesContainer.style.opacity = 1;
}

function getCountryData(country) {
  const request = new XMLHttpRequest();
  request.open("GET", `https://restcountries.com/v2/name/${country}`);
  request.send();

  request.addEventListener("load", function () {
    const [data] = JSON.parse(this.responseText);
    renderCountry(data);
  });
}

function getCountryAndNeighbour(country) {
  const request = new XMLHttpRequest();
  request.open("GET", `https://restcountries.com/v2/name/${country}`);
  request.send();

  request.addEventListener("load", function () {
    const [data] = JSON.parse(this.responseText);
    renderCountry(data);

    const neighbours = data.borders;
    neighbours.forEach((neighbour) => {
      if (!neighbour) return;
      const request2 = new XMLHttpRequest();
      request2.open("GET", `https://restcountries.com/v2/alpha/${neighbour}`);
      request2.send();

      request2.addEventListener("load", function () {
        const data2 = JSON.parse(this.responseText);
        renderCountry(data2, "neighbour");
      });
    });
  });
}

function renderAllCounty() {
  const request = new XMLHttpRequest();
  request.open("GET", "https://restcountries.com/v2/all?fields=name");
  request.send();

  request.addEventListener("load", function () {
    const data = JSON.parse(this.responseText);
    for (let i = 0; i < data.length; i++) {
      getCountryData(data[i].name);
    }
  });
}


function getJSON(url, errorMessage = "Something went wrong") {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${errorMessage} (${response.status})`);
    return response.json();
  });
}

function getCountryDataFetch(country) {
  getJSON(`https://restcountries.com/v2/name/${country}`, "Country not found")
    .then((data) => {
      renderCountry(data[0]);
      const neighbour = data[0].borders[0];
      if (!neighbour) throw new Error("No neighbour found");

      // neighbour country
      return getJSON(
        `https://restcountries.com/v2/alpha/${neighbour}`,
        "Country not found",
      );
    })
    .then((data) => renderCountry(data, "neighbour"))
    .catch((error) => {
      console.error(`${error} 💥💥💥 `);
      renderError(`Something went wrong ${error.message}, Try again!`);
    });
}

// Different implement whereAmI func with no promise
// function whereAmI(lat, lng) {
//   fetch(
//     `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`,
//   )
//     .then((response) => {
//       if (!response.ok)
//         throw new Error(`Can't find your location (${response.status})`);
//       return response.json();
//     })
//     .then((data) => {
//       console.log(`You are in ${data.city}, ${data.countryName}`);
//
//       return fetch(`https://restcountries.com/v2/name/${data.countryName}`);
//     })
//     .then((response) => {
//       if (!response.ok)
//         throw new Error(`Country not found (${response.status})`);
//       return response.json();
//     })
//     .then((data) => renderCountry(data[0]))
//     .catch((error) => console.error(`${error.message} 💥`));
// }

// btn.addEventListener("click", function () {
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(function (position) {
//       const { latitude } = position.coords;
//       const { longitude } = position.coords;
//       whereAmI(latitude, longitude);
//     });
//   }
// });

function getPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// Different whereAmI func with promise
// function whereAmI() {
//   getPosition()
//     .then((pos) => {
//       const { latitude: lat, longitude: lng } = pos.coords;

//       return fetch(
//         `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`,
//       );
//     })
//     .then((response) => {
//       if (!response.ok)
//         throw new Error(`Can't find your location (${response.status})`);
//       return response.json();
//     })
//     .then((data) => {
//       console.log(`You are in ${data.city}, ${data.countryName}`);

//       return fetch(`https://restcountries.com/v2/name/${data.countryName}`);
//     })
//     .then((response) => {
//       if (!response.ok)
//         throw new Error(`Country not found (${response.status})`);
//       return response.json();
//     })
//     .then((data) => renderCountry(data[0]))
//     .catch((error) => console.error(`${error.message} 💥`));
// }
// btn.addEventListener("click", whereAmI);

// Different whereAmI func with async
async function whereAmI() {
  try {
    const position = await getPosition();
    const { latitude: lat, longitude: lng } = position.coords;
    const resGeo = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`,
    );
    if (!resGeo.ok) throw new Error("Problem getting location data");

    const dataGeo = await resGeo.json();
    const response = await fetch(
      `https://restcountries.com/v2/name/${dataGeo.countryName}`,
    );
    if (!response.ok) throw new Error("Problem getting country data");
    const [data] = await response.json();
    renderCountry(data);
    return `You are in ${dataGeo.city}, ${dataGeo.countryName}`;
  } catch (error) {
    renderError(`${error} 💥`);
    console.error(error.message);
  }
}
(async function () {
  try {
    // this private func for send error message from whereImA(), so when the url or code doesnt send error message
  } catch (error) {
    console.error(`${error.message} 💥`);
  }
})();
btn.addEventListener("click", whereAmI);

// const get3Countries = async (c1, c2, c3) => {
//   try {
//     const data = await Promise.all([
//       getJSON(`https://restcountries.com/v2/name/${c1}`),
//       getJSON(`https://restcountries.com/v2/name/${c2}`),
//       getJSON(`https://restcountries.com/v2/name/${c3}`),
//     ]);
//     console.log(data.map((data) => data[0].capital));
//   } catch (error) {
//     console.error(error);
//   }
// };
// get3Countries("indonesia", "japan", "china");

// (async function () {
//   const [res] = await Promise.race([
//     getJSON(`https://restcountries.com/v2/name/italy`),
//     getJSON(`https://restcountries.com/v2/name/egypt`),
//     getJSON(`https://restcountries.com/v2/name/mexico`),
//   ]);
//   console.log(res);
// })();

function timeout(sec) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request took too long!")), sec * 1000);
  });
}

function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

function createImage(imgPath) {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = `img/${imgPath}`;
    img.addEventListener("load", function () {
      imgContainer.append(img);
      resolve(img);
    });
    img.addEventListener("error", function () {
      reject(new Error("Image not found"));
    });
  });
}

// let currentImg;
// createImage("img-1.jpg")
//   .then((img) => {
//     currentImg = img;
//     console.log("Image 1 loaded");
//     return wait(2);
//   })
//   .then(() => {
//     currentImg.style.display = 'none'
//     return createImage('img-2.jpg')
//   })
//   .then((img) => {
//     currentImg = img;
//     console.log("Image 2 loaded");
//     return wait(2);
//   })
//   .then(() => {
//     currentImg.style.display = 'none'
//     return createImage('img-3.jpg')
//   })
//   .then((img) => {
//     currentImg = img;
//     console.log("Image 3 loaded");
//   })
//   .catch((err) => console.error(err));

async function loadNPause() {
  try {
    let img = await createImage("img-1.jpg");
    console.log("Image 1 loaded");
    await wait(2);
    img.style.display = "none";
    img = await createImage("img-2.jpg");
    console.log("Image 2 loaded");
    await wait(2);
    img.style.display = "none";
    img = await createImage("img-3.jpg");
    console.log("Image 3 loaded");
  } catch (error) {
    console.log(error);
  }
}

async function loadAll(imgArr) {
  const imgs = imgArr.map(img => createImage(img))
  const imgsEl = await Promise.all(imgs) 
  imgsEl.forEach(img => img.classList.add('parallel'))
}
// loadAll(['img-1.jpg', 'img-2.jpg', 'img-3.jpg'])