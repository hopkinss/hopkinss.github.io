window.addEventListener('load',function() {

    /*===================================================================
    |  bind the addItem function
    *====================================================================*/
    document.querySelectorAll('button').forEach((item) => {
        item.classList.add('btn', 'btn-primary');
        item.addEventListener('click',function (e) {
            addItem(e.target);
        })
    });

    /*===================================================================
    | Enable sorting of lists
    *====================================================================*/
    $( function() {
        $( "#listToday" ).sortable();
        $( "#listToday" ).disableSelection();
        $( "#listLater" ).sortable();
        $( "#listLater" ).disableSelection();
    } );

});


/*===================================================================
| Create the <li><buttons><span> items and bind
*====================================================================*/
const addItem = function (sender) {

    // Get the UL and Textbox items
    let timePoint = sender.id.indexOf('Today') > 0 ? "Today" : "Later";
    let tgt = document.getElementById( "list" + timePoint);
    let dest = timePoint == 'Today' ? document.getElementById('list' + 'Later') : document.getElementById('list' + 'Today');
    let itm = document.getElementById( "txtAdd" + timePoint);
    itm.focus();
    if (itm.value == ""){
        return;
    }

    /*-------------------------------------------------------------------
    | create a new span with move and delete buttons
    *--------------------------------------------------------------------*/
    let li = document.createElement('li');
    li.classList.add('item' + timePoint);
    let spn = document.createElement('span');
    spn.innerHTML=itm.value;
    let check = document.createElement('i');
    check.classList.add('fa','check');
    spn.prepend(check);

    /*-------------------------------------------------------------------
    | Toggle the done state of the event using a check
    *--------------------------------------------------------------------*/
    spn.addEventListener('click', function (e) {

        let ele = e.target.querySelectorAll('i')[0];
        if (ele.classList.contains('fa-check')){
            ele.classList.remove('fa-check');
        }
        else{
            ele.classList.add('fa-check');
        }
    })

    let btnDiv = document.createElement('div');
    btnDiv.classList.add('btn-group','my-btn-group');

    /*-------------------------------------------------------------------
    | Add the move button to the button div
    *--------------------------------------------------------------------*/
    let move = document.createElement('a');
    move.classList.add('btn','btn-secondary');
    let moveBtn = document.createElement('i');
    if (timePoint == 'Today') {
        moveBtn.classList.add('fa', 'fa-arrow-circle-o-right', 'add');
    }
    else{
        moveBtn.classList.add('fa', 'fa-arrow-circle-o-left', 'add');
    }

    moveBtn.addEventListener('click', function (e) {
        moveItem(e);
        e.stopPropagation();
    })
    move.addEventListener('click',function (e) {
        moveItem(e);
    })
    move.appendChild(moveBtn);

    /*-------------------------------------------------------------------
    | Add the move delete button to the button div
    *--------------------------------------------------------------------*/
    let del = document.createElement('a');
    del.classList.add('btn','btn-secondary');
    let minus = document.createElement('i');
    minus.classList.add('fa','fa-minus-circle','minus');

    minus.addEventListener('click', function (e) {
        deleteItem(e);
        e.stopPropagation();
    })
    del.addEventListener('click',function (e) {
        deleteItem(e);
    })

    del.appendChild(minus);

    btnDiv.appendChild(del);
    btnDiv.appendChild(move);

    // add button group to span
    li.append(btnDiv);
    li.appendChild(spn);
    tgt.appendChild(li);
    itm.value='';
    
}

/*===================================================================
| Move a list item between two UL
*====================================================================*/
const moveItem = function (e) {

    let sender = e.target;

    if (e.target.nodeName == "A"){
        sender=e.target.querySelectorAll('i')[0];
    }
    else {
        sender = e.target;
    }

    let btn = sender.parentNode;
    let li = sender.parentNode.parentNode.parentNode;
    let src = sender.parentNode.parentNode.parentNode.parentNode;
    let dest = src.id  == 'listToday' ? document.getElementById('listLater') : document.getElementById('listToday');


    let freeElm = src.removeChild(li);
    dest.appendChild(freeElm);
    let move = li.querySelectorAll('a')[1].childNodes[0];
    if (move.classList.contains('fa-arrow-circle-o-right')){
        move.classList.remove('fa-arrow-circle-o-right');
        move.classList.add('fa-arrow-circle-o-left');
    }
    else{
        move.classList.remove('fa-arrow-circle-o-left');
        move.classList.add('fa-arrow-circle-o-right');
    }
}

/*===================================================================
| Delete a list item
*====================================================================*/
const deleteItem = function (e) {
    let sender = e.target;

    if (e.target.nodeName == "A"){
        sender=e.target.querySelectorAll('i')[0];
    }
    else {
        sender = e.target;
    }

    let btn = sender.parentNode;
    let li = sender.parentNode.parentNode.parentNode;
    let src = sender.parentNode.parentNode.parentNode.parentNode;

    src.removeChild(li);
}

