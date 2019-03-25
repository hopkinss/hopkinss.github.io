$(document).ready(function() {

    const formEl = document.getElementById('form-movies')
        .addEventListener('submit', function(e) {

            e.preventDefault();
            const searchString = document.getElementById('search-movies').value;
            const errorSearch = document.getElementById('error-search-movies');
            if (searchString.length >= 2){
                errorSearch.innerHTML = "";
                errorSearch.classList.remove('d-block');
                searchForMovies(searchString);
            }
            else {
                errorSearch.innerHTML = "Movie name must be at least two characters";
                errorSearch.classList.add('d-block');
            }
        });

    $("#nav-buttons").find("button").on('click',function (e) {
        navigateCurrentMovies(e);
    })

    $("i.rate-btn").on('click',function (e) {
        recordRating(e);
    })

    localStorage.setItem("genres","");


});

var BASEURL='https://www.omdbapi.com';
var recHolder = {page:1,pageOf:1,search:""};

const PlotDataPoint = function (genre) {
    this.genre = genre.trim();
}

PlotDataPoint.prototype.getCategory  = function () {

    types =  [['Action',1], ['Adventure',1], ['Animation',2], ['Biography',3], ['Comedy',6], ['Crime',1],
                ['Fantasy',3],['Documentary',3], ['Drama',4], ['Family',2],
    ['History',3],['Horror',1], ['Music',5], ['Musical',5], ['Mystery',6], ['Romance',4],
    ['Sci-Fi',3], ['Short',2], ['Sport',1], ['Thriller',1], ['War',1]];

    let fcat;

    for(let t of types){
        if (t[0] == this.genre){
            fcat=t[1];
        }
    }
    if (fcat) {
        return fcat;
    }
    else{
        return 7;
    }
}


// Create a Movie object
const Movie = function (title,year,imdb,cover) {

    this.title = title;
    this.year  = year;
    this.id = imdb;
    this.cover = cover;
}

// Create MovieDetails object
const MovieDetails = function (title,poster,id,boxOffice,country,language,plot,rated,released,website,genre,rating,actors) {

    this.title=title;
    this.poster=poster;
    this.id = id;
    this.boxOffice=boxOffice;
    this.country=country;
    this.language=language;
    this.plot=plot;
    this.rated=rated;
    this.released  = released;
    this.website =website;

    this.genres = genre;
    this.rating=rating;
    this.actors = actors.split(',');

}

const searchForMovies = function (s_val) {
    let url  = `${BASEURL}/?s=${s_val}&type=movie&apikey=${APIKEY}`;
    $("#nav-buttons").removeClass('hide');


    $.ajax({
        url: url
    }).then(function(data) {
        if ( data['Response']){
            let movies = [];

            totalPages =  Math.ceil (parseInt( data['totalResults'])/10);
            recHolder = {page:1,pageOf:totalPages,search:s_val};

            const counter = document.getElementById('movies-total');
            counter.innerHTML = `Page 1 of ${totalPages}`;

            for(let m of data['Search']){
                // Create a new movie
                const movie= new Movie(m['Title'],m['Year'],m['imdbID'],m['Poster']);
                movies.push(movie);
            }
            buildMovieList(movies);
        }
    });
}

const navigateCurrentMovies = function (e) {

    let btn = e.target.id.split('-')[1];
    let currPage=recHolder.page,lastPage=recHolder.pageOf;
    let toPage;
    switch (btn) {
        case 'next':
            if (currPage<lastPage){
                toPage=currPage+1;
            }
            else{
                toPage=currPage;
            }
            break;
        case "last":
            toPage=lastPage;
            break;
        case "previous":
            if(currPage-1>0){
                toPage=currPage-1;
            }
            else {
                toPage=currPage;
            }
            break;
        case "first":
            toPage=1;
            break;
    }

    recHolder.page=toPage;

    let url  = `${BASEURL}/?s=${recHolder.search}&type=movie&apikey=${APIKEY}&page=${toPage}`;

    $.ajax({
        url: url
    }).then(function(data) {
        if ( data['Response']){
            let movies = [];

            const counter = document.getElementById('movies-total');
            counter.innerHTML = `Page ${toPage} of ${lastPage}`;

            for(let m of data['Search']){
                // Create a new movie
                const movie= new Movie(m['Title'],m['Year'],m['imdbID'],m['Poster']);
                movies.push(movie);
            }
            buildMovieList(movies);
        }
    });
}



const buildMovieList= function (list){
    let ul = document.getElementById("list-movies");

    while(ul.firstChild){
        ul.removeChild(ul.firstChild);
    }

    for(let m of list) {
        let li=document.createElement('li');
        li.innerHTML=m.title;
        li.setAttribute('id',m.id);
        Object.assign(li, {title:m.title,id:m.id,year:m.year,link:m.cover});

        li.addEventListener('click',function (e) {
            getSelectedMovie(e.target);
        });

        ul.appendChild(li);
    }
}

const getSelectedMovie = function (movie) {
    const url  = `${BASEURL}/?i=${movie['id']}&plot=full&apikey=${APIKEY}`;

    $.ajax({
        url: url
    }).then(function(data) {
        if ( data['Response']){

            const movieDetails = new MovieDetails(data['Title'],data['Poster'],data['imdbID'],data['BoxOffice'],data['Country'],
                data['Language'],data['Plot'],data['Rated'],data['Released'],data['Website'],data['Genre'],
                data['imdbRating'],data['Actors']);

            displaySelectedMovie(movieDetails);

        }
    });


}


const displaySelectedMovie = function (movie) {

    $("#div-movie").removeClass('no-display');
    $("#title1-movie").html(movie['title']);
    document.getElementById('img-movie').src = movie['poster'];
    document.getElementById('txt-movie').innerText=movie['plot'];

    $('#td-country').html(movie['country']);
    $('#td-language').html(movie['language']);
    $('#td-genre').html(movie['genres']);
    $('#td-rating').html(movie['rated']);
    $('#td-released').html(movie['released']);

    let range;
    try{
       range = parseFloat(movie['rating']);
        $('#score-movie').val(range);
    }
    catch (e) {
        range='N/A';
    }
    $('#td-score-value').html(range);

}

const recordRating = function(e){

    if (sender=e.target.id == "isGood"){

        let genres = localStorage.getItem('genres');

        genres  += `${genres.length>0 ? ",":""}${document.getElementById('td-genre').innerText}`;
        localStorage.setItem('genres',genres);
    }

    graphUserPref();
}



const graphUserPref = function () {

    let raw = localStorage.getItem('genres').split(',');

    let counts = [0,0,0,0,0,0,0];
    for(let dp of raw){
        var p = new PlotDataPoint(dp);
        counts[p.getCategory()-1]++;
    }

    let labels=["Dude Movie","Kids Film","Nerdcore","Chick Flick","Artsy","Date Night","Unknown"];

    let colors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(0, 0, 0, 1)'];

    let data = [];
    for(let i = 0;i<counts.length;i++){
        let d={
            'value':counts[i],
            'label':labels[i],
            'color':colors[i]
        };
        data.push(d);
    }

    new Chart(document.getElementById('plot').getContext('2d')).Doughnut(data);
    makeLegend(colors,labels);
}

const makeLegend = function (colors, labels) {

    let ul = document.getElementById('legend');
    while(ul.firstChild)
        ul.removeChild(ul.firstChild);

    for(let i = 0;i<colors.length;i++) {

        let li=document.createElement('li');
        li.innerHTML=labels[i];
        li.setAttribute('style',`color:${colors[i]};`);

        ul.appendChild(li);
    }
}