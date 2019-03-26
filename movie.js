$(document).ready(function() {

/*========================================================================
| Requirement 1: Validate form field seach-movies
|=========================================================================*/
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
    localStorage.setItem('count', "0");
});


var recHolder = {page:1,pageOf:1,search:""};


/*========================================================================
| Requirement 2: Constructor with a prototype
|=========================================================================*/
const PlotDataPoint = function (genre) {
    this.genre = genre.trim();
}

PlotDataPoint.prototype.typeMap=[['Action',1], ['Adventure',1], ['Animation',2], ['Biography',3], ['Comedy',6], ['Crime',1],
    ['Fantasy',3],['Documentary',3], ['Drama',4], ['Family',2],
    ['History',3],['Horror',1], ['Music',5], ['Musical',5], ['Mystery',6], ['Romance',4],
    ['Sci-Fi',3], ['Short',2], ['Sport',1], ['Thriller',1], ['War',1],['Western',1]];

PlotDataPoint.prototype.getCategory  = function () {

    let fcat;
    for(let t of this.typeMap){
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

/*========================================================================
| Requirement 3: fetch request from a 3rd party API
|=========================================================================*/
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

    if (currPage === undefined){
        let x =1;
    }

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
        $('#score-movie').attr('readonly',true);
        $('#score-movie').attr('disabled',true);
    }
    catch (e) {
        range='N/A';
    }
    $('#td-score-value').html(range);
    $("#isGood").attr('disabled',false);
}

/*========================================================================
| Requirement 4: read/set localStorage
|=========================================================================*/
const recordRating = function(e){

    if (sender=e.target.id == "isGood"){

        let genres = localStorage.getItem('genres');
        let nmovies = (parseInt(localStorage.getItem('count')) + 1);
        genres  += `${genres.length>0 ? ",":""}${document.getElementById('td-genre').innerText}`;
        localStorage.setItem('genres',genres);
        localStorage.setItem('count',nmovies.toString());

        $(`#${e.target.id}`).attr('disabled',true);

    }
    graphUserPref();
}

const graphUserPref = function () {

    $("#genre").removeClass('hide');
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
    makeLegend(colors,labels,counts);
}

const makeLegend = function (colors, labels, counts) {

    let ul = document.getElementById('legend');
    while(ul.firstChild)
        ul.removeChild(ul.firstChild);

    let maxPos=0,maxCount=0;

    let dp = new PlotDataPoint('unknown');

    for(let i = 0;i<colors.length;i++) {

        if (counts[i]> 0) {

            if (counts[i]>maxCount){
                maxCount=counts[i];
                maxPos=i;
            }

            let li = document.createElement('li');
            li.innerHTML = labels[i];
            li.setAttribute('class','btn');


            // Add a title that includes all the genres that makeup a category
            let title=[];
            for(let t of dp.typeMap){
                if (t[1] == i+1) {
                    if (t[0] != undefined){
                        title.push(t[0]);
                    }
                }
            }

            li.setAttribute('style', `width:200px;color:white;font-weight:bold;background-color:${colors[i]};`);
            li.setAttribute('title',`This category includes the following genres: ${title.join(', ')}`);
            ul.appendChild(li);
        }
    }

    let fav,favStyle;
    if (counts.filter(i => i === maxCount).length>1){
        fav="tied, rate more movies";
        favStyle='style="background-color: #e8e8e8;"';
    }

    else{
        fav=labels[maxPos];
        favStyle=`style="background-color:${colors[maxPos]};"`;
    }

    let n = localStorage.getItem('count');
    $("#n").html(`N = ${n}`);
    $("#genre-title").html(`User Genre Preference: <button class="btn" ${favStyle}>${fav}</button> <i style="font-family: Arial;">out of ${n} movies reviewed</i>`);

}