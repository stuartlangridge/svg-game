let book_page = 1;
let book_child_level = 4;

handlers.book_child_move = (el, event) => {
    // get dragged element and those it's paired with
    let thisend = el;
    let [c, group, end] = el.id.split("_");
    let otherend_id = c + "_" + group + "_" + (end == "1" ? "2" : "1");
    let otherend = document.getElementById(otherend_id);
    let rope = document.getElementById("rope_" + group);
    //console.log("Moving", thisend.id, "attached to", otherend_id, "by", rope.id);

    // calculate positions for everything so child can't be dragged off page
    let start = {x: event.pageX, y: event.pageY}
    let ctm = document.querySelector("svg").getScreenCTM();
    let bookPageBorders = document.querySelector("#page_right_2_page").getBBox();
    let elStart = handlers.get_transformed_bbox(el);
    let mindx = -(elStart.x - bookPageBorders.x);
    let mindy = -(elStart.y - bookPageBorders.y);
    let maxdx = (bookPageBorders.x + bookPageBorders.width - elStart.x - elStart.width);
    let maxdy = (bookPageBorders.y + bookPageBorders.height - elStart.y - elStart.height);
    let previousTransform = el.getAttribute("transform") || "";

    function mm(e) {
        let dx = Math.round(e.pageX - start.x);
        let dy = Math.round(e.pageY - start.y);
        // convert to svg matrix as per http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
        // (we don't need to subtract ctm.e etc because we're dealing with deltas, not absolutes)
        let nx = dx / ctm.a;
        let ny = dy / ctm.d;
        if (nx < mindx) { nx = mindx; }
        if (nx > maxdx) { nx = maxdx; }
        if (ny < mindy) { ny = mindy; }
        if (ny > maxdy) { ny = maxdy; }
        el.setAttribute("transform", previousTransform + " translate(" + nx + " " + ny + ")");
    }
    function mu(e) {
        document.removeEventListener("mousemove", mm);
        document.removeEventListener("mouseup", mu);

        // consolidate transforms on el
        let ts = el.getAttribute("transform").match(/[0-9.-]+/g).map(v => parseFloat(v));
        let nx, ny;
        if (ts.length == 2) {
            nx = Math.round(ts[0]);
            ny = Math.round(ts[1]);
        } else {
            nx = 0;
            ny = 0;
            for (let i=0; i<ts.length; i+=2) {
                nx += Math.round(ts[i]);
                ny += Math.round(ts[i+1]);
            }
        }
        el.setAttribute("transform", "translate(" + nx + " " + ny + ")");

        // move the rope
        let thisend_bb = handlers.get_transformed_bbox(thisend);
        let otherend_bb = handlers.get_transformed_bbox(otherend);
        let ropestartx = Math.round(thisend_bb.x + (thisend_bb.width / 2));
        let ropestarty = Math.round(thisend_bb.y + (thisend_bb.height / 2));
        let ropeendx = Math.round(otherend_bb.x + (otherend_bb.width / 2));
        let ropeendy = Math.round(otherend_bb.y + (otherend_bb.height / 2));
        rope.setAttribute("d", "M" + ropestartx + "," + ropestarty + " " + ropeendx + "," + ropeendy);

        // calculate crossings by seeing if the ropes intersects any of the four lines of the square of an adult
        let ropes = [];
        for (var i=1; i<book_child_level; i++) { ropes.push(document.getElementById("rope_" + i)); }
        let rnums = ropes.map(r => {
            return r.getAttribute("d").match(/[0-9.-]+/g).map(n => { return Math.round(parseFloat(n)); })
        })
        let ropes_lines = rnums.map(rn => {
            return [{x: rn[0], y: rn[1]}, {x: rn[2], y: rn[3]}]
        })
        let unfilled = 0;
        Array.from(document.querySelectorAll("#adult_" + book_child_level + " path")).forEach(adult => {
            let bb = adult.getBBox();
            let bbedges = [
                [ // top
                    {x: Math.round(bb.x), y: Math.round(bb.y)},
                    {x: Math.round(bb.x+bb.width), y: Math.round(bb.y)}
                ],
                [ // left
                    {x: Math.round(bb.x), y: Math.round(bb.y)},
                    {x: Math.round(bb.x), y: Math.round(bb.y+bb.height)}
                ],
                [ // bottom
                    {x: Math.round(bb.x+bb.width), y: Math.round(bb.y)},
                    {x: Math.round(bb.x+bb.width), y: Math.round(bb.y+bb.height)}
                ],
                [ // right
                    {x: Math.round(bb.x), y: Math.round(bb.y+bb.height)},
                    {x: Math.round(bb.x+bb.width), y: Math.round(bb.y+bb.height)}
                ]
            ];

            let intersections = 0;
            ropes_lines.forEach((rope_line, ridx) => {
                bbedges.forEach((bbedge, bidx) => {
                    if (handlers.lines_intersect(rope_line[0], rope_line[1], bbedge[0], bbedge[1])) {
                        intersections += 1;
                        /*
                        console.log("%cr", "background:#9f9", ridx, 
                            "(" + rope_line[0].x + "," + rope_line[0].y + "-" + rope_line[1].x + "," + rope_line[1].y + ")",
                            adult.id, bidx,
                            "(" + bbedge[0].x + "," + bbedge[0].y + "-" + bbedge[1].x + "," + bbedge[1].y + ")", "HIT");
                        */
                    }
                })
            })

            if (intersections > 0) {
                adult.style.fill = "black";
            } else {
                var prevfill = adult.getAttribute("data-fill");
                adult.style.fill = prevfill;
                unfilled += 1;
            }
        });
        if (unfilled == 0) {
            // hide this level
            let exiting_book_child_level = book_child_level;
            book_child_level += 1;

            document.getElementById("ignite").play();
            document.querySelector("#flames_" + exiting_book_child_level).style.visibility = "visible";
            setTimeout(() => { document.querySelector("#adult_" + exiting_book_child_level).style.visibility = "hidden"; }, 250);
            setTimeout(() => { document.querySelector("#flames_" + exiting_book_child_level).style.visibility = "hidden"; }, 600);

            // and go to the next level
            setTimeout(handlers.book_child_init_level, 700);
        }
    }

    document.addEventListener("mousemove", mm);
    document.addEventListener("mouseup", mu);
    return;
}

handlers.book_child_init_level = () => {
    // hide all children and ropes
    Array.from(document.querySelectorAll('g[id^="adult_"]')).forEach(c => { c.style.visibility = "hidden"; });
    Array.from(document.querySelectorAll('[id^="child_"]')).forEach(c => { c.style.visibility = "hidden"; });
    Array.from(document.querySelectorAll('[id^="rope_"]')).forEach(c => { c.style.visibility = "hidden"; });
    // show children and ropes for this level
    if (book_page == 2) {
        if (book_child_level == 5) {
            console.log("victory is mine! show the puzzle answer!")
        } else {
            document.querySelector("#adult_" + book_child_level).style.visibility = "visible";
            for (var i=1; i<book_child_level; i++) {
                let c1 = document.getElementById("child_" + i + "_1");
                c1.style.visibility = "visible";
                c1.setAttribute("transform", "");
                let c2 = document.getElementById("child_" + i + "_2");
                c2.style.visibility = "visible";
                c2.setAttribute("transform", "");
                let rope = document.getElementById("rope_" + i);
                rope.style.visibility = "visible";
                // move the rope
                let thisend_bb = handlers.get_transformed_bbox(c1);
                let otherend_bb = handlers.get_transformed_bbox(c2);
                let ropestartx = Math.round(thisend_bb.x + (thisend_bb.width / 2));
                let ropestarty = Math.round(thisend_bb.y + (thisend_bb.height / 2));
                let ropeendx = Math.round(otherend_bb.x + (otherend_bb.width / 2));
                let ropeendy = Math.round(otherend_bb.y + (otherend_bb.height / 2));
                rope.setAttribute("d", "M" + ropestartx + "," + ropestarty + " " + ropeendx + "," + ropeendy);
            }
        }
    }
}

handlers.book_right = el => {
    book_page += 1;
    handlers.book_set_page(book_page);
}

handlers.book_left = el => {
    if (book_page > 1) {
        book_page -= 1;
        handlers.book_set_page(book_page);
    }
}

handlers.book_init = el => {
    Array.from(document.querySelectorAll('[id^="adult_"] path')).forEach(adult => {
        adult.setAttribute("data-fill", adult.style.fill);
    })
    handlers.book_set_page(book_page);
}

handlers.book_set_page = required_page => {
    Array.from(document.querySelectorAll('g[id^="page_"]')).forEach(page_el => {
        let pageno = parseInt(page_el.id.split("_")[1], 10);
        if (pageno == required_page) {
            page_el.style.visibility = "visible";
        } else {
            page_el.style.visibility = "hidden";
        }
    })
    handlers.book_child_init_level();
}
