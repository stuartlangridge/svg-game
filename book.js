let book_page = 1;

handlers.book_child_move = (el, event) => {
    // get dragged element and those it's paired with
    let thisend = el;
    let [c, level, group, end] = el.id.split("_");
    let otherend_id = c + "_" + level + "_" + group + "_" + (end == "1" ? "2" : "1");
    let otherend = document.getElementById(otherend_id);
    let rope = document.getElementById("rope_" + level + "_" + group);
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
        let rope1 = document.getElementById("rope_3_1");
        let rope2 = document.getElementById("rope_3_2");
        let rnums1 = rope1.getAttribute("d").match(/[0-9.-]+/g).map(n => { return Math.round(parseFloat(n)); })
        let rbb1s = {x: rnums1[0], y: rnums1[1] };
        let rbb1e = {x: rnums1[2], y: rnums1[3] };
        let rnums2 = rope2.getAttribute("d").match(/[0-9.-]+/g).map(n => { return Math.round(parseFloat(n)); })
        let rbb2s = {x: rnums2[0], y: rnums2[1] };
        let rbb2e = {x: rnums2[2], y: rnums2[3] };
        let unfilled = 0;
        Array.from(document.querySelectorAll("#adult_3 path")).forEach(adult => {
            let bb = adult.getBBox();
            let bbt1 = {x: Math.round(bb.x), y: Math.round(bb.y)};
            let bbt2 = {x: Math.round(bb.x+bb.width), y: Math.round(bb.y)};
            let bbl1 = {x: Math.round(bb.x), y: Math.round(bb.y)};
            let bbl2 = {x: Math.round(bb.x), y: Math.round(bb.y+bb.height)};
            let bbr1 = {x: Math.round(bb.x+bb.width), y: Math.round(bb.y)};
            let bbr2 = {x: Math.round(bb.x+bb.width), y: Math.round(bb.y+bb.height)};
            let bbb1 = {x: Math.round(bb.x), y: Math.round(bb.y+bb.height)};
            let bbb2 = {x: Math.round(bb.x+bb.width), y: Math.round(bb.y+bb.height)};

            if (handlers.lines_intersect(rbb1s, rbb1e, bbt1, bbt2) ||
                handlers.lines_intersect(rbb1s, rbb1e, bbl1, bbl2) ||
                handlers.lines_intersect(rbb1s, rbb1e, bbb1, bbb2) ||
                handlers.lines_intersect(rbb1s, rbb1e, bbr1, bbr2) ||
                handlers.lines_intersect(rbb2s, rbb2e, bbt1, bbt2) ||
                handlers.lines_intersect(rbb2s, rbb2e, bbl1, bbl2) ||
                handlers.lines_intersect(rbb2s, rbb2e, bbb1, bbb2) ||
                handlers.lines_intersect(rbb2s, rbb2e, bbr1, bbr2)) {
                adult.style.fill = "black";
            } else {
                var prevfill = adult.getAttribute("data-fill");
                adult.style.fill = prevfill;
                unfilled += 1;
            }
        });
        if (unfilled == 0) {
            document.getElementById("ignite").play();
            document.querySelector("#flames_3").style.visibility = "visible";
            setTimeout(() => { document.querySelector("#adult_3").style.visibility = "hidden"; }, 500);
            setTimeout(() => { document.querySelector("#flames_3").style.visibility = "hidden"; }, 1000);
        }
    }

    document.addEventListener("mousemove", mm);
    document.addEventListener("mouseup", mu);
    return;
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
    Array.from(document.querySelectorAll("#adult_3 path")).forEach(adult => {
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
}
