let children_order = "";
let children_posns = {};
let children_posns_num = {};
let children_connections = [[0, 1], [0, 3], [1, 2], [1, 4], 
    [2, 5], [3, 6], [3, 4], [4, 5], [4, 7], [5, 8], [6, 7], [7, 8]];

handlers.children_init = el => {
    console.log("children init!");
    children_order = "edrnhcli_";
    for (let i=0; i<children_order.length; i++) {
        let el;
        if (children_order[i] == "_") {
            el = document.getElementById("children_empty");
        } else {
            el = document.getElementById("children_" + children_order[i]);
        }
        children_posns_num[i] = el.getBBox();
        children_posns[children_order[i]] = el.getBBox();
    }
}

handlers.children_click = el => {
    let letter = el.id.split("_")[1];
    if (letter == "empty") return;
    let lpos = children_order.indexOf(letter);
    let empty = children_order.indexOf("_");
    let fromok = children_connections.filter(([a, b]) => a == lpos && b == empty);
    let took = children_connections.filter(([a, b]) => b == lpos && a == empty);
    let swapsies = null;
    if (fromok.length > 0 || took.length > 0) {
        // swap letter and empty
        let arr = Array.from(children_order);
        let tmp = arr[lpos];
        arr[lpos] = "_";
        arr[empty] = tmp;
        children_order = arr.join("");
        for (let i=0; i<children_order.length; i++) {
            let el;
            if (children_order[i] == "_") {
                el = document.getElementById("children_empty");
            } else {
                el = document.getElementById("children_" + children_order[i]);
            }
            let dx = children_posns_num[i].x - children_posns[children_order[i]].x;
            el.setAttribute("transform", "translate(" + dx + " 0)");
        }
    }
    if (children_order == "children_") {
        console.log("victory!");
    }
}
