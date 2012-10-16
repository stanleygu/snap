$(document).ready(function() {

    var NODESIZE = {
        reaction: 2,
        species: 8
    };

    var sbmlDoc;
    var $sbmlDoc;
    var text;
    var circle;
    var path;

    var simpleModel;
    var glycolysisModel;

    var selectedNode;
    var svg;

    $.get('./00011-sbml-l2v4.xml', function(data) {
        simpleModel = (new XMLSerializer()).serializeToString(data);
    });

    $.get('./Jana_WolfGlycolysis.xml', function(data) {
        glycolysisModel = (new XMLSerializer()).serializeToString(data);
    });


    $("textarea").val(simpleModel);

    $("#helpText").hide();

    $("button#btnLoadSimple").click(function() {
        $("textarea").val(simpleModel);
    });

    $("button#btnLoadGlycolysis").click(function() {
        $("textarea").val(glycolysisModel);
    });


    var links = [];
    var nodes = {};

    $("button#btnViewNetwork").click(function() {
        var str = $("textarea").val();
        $("p").hide("slow");
        $("textarea").hide("slow");
        $(this).hide("slow").add($("button#btnLoadSimple")).add($("button#btnLoadGlycolysis")).hide("slow");

        $("#helpText").show("slow");

        sbmlDoc = $.parseXML(str);
        $sbmlDoc = $(sbmlDoc);


        // generating nodes from listOfSpecies
        $sbmlDoc.find("species").each(function(n) {
            nodes[this.getAttribute('id')] = {
                name: this.getAttribute('id'),
                compartment: this.getAttribute('compartment'),
                initialAmount: this.getAttribute('initialAmount'),
                substanceUnits: this.getAttribute('substanceUnits'),
                type: 'species',
                visible: true,
                boundaryCondition: this.getAttribute('boundaryCondition') || false
            };
        });

        // creating nodes from reactions
        $sbmlDoc.find("reaction").each(function(n) {
            var reactionName = this.getAttribute('id');
            nodes[reactionName] = {
                name: reactionName,
                type: 'reaction',
                reversible: this.getAttribute('reversible') || false,
                fast: this.getAttribute('fast') || false,
                listOfReactants: $(this.getElementsByTagName('listOfReactants')).find('speciesReference'),
                listOfProducts: $(this.getElementsByTagName('listOfProducts')).find('speciesReference'),
                kineticLaw: this.getElementsByTagName('kineticLaw')[0]
            };

            // making links from reactants to reaction node
            var reactants = nodes[reactionName].listOfReactants;
            var products = nodes[reactionName].listOfProducts;
            if (reactants.length > 1 || products.length > 1) {
                for (var i = 0; i < reactants.length; i++) {
                    var species = reactants[i].getAttribute('species');
                    links.push({
                        source: nodes[species],
                        target: nodes[reactionName],
                        type: 'fromReactants'
                    });
                }
                // making links from reaction node to products
                for (var i = 0; i < products.length; i++) {
                    var species = products[i].getAttribute('species');
                    links.push({
                        source: nodes[reactionName],
                        target: nodes[species],
                        type: 'toProducts'
                    });
                }
                // make reaction node visible
                nodes[reactionName].visible = true;
            }
            else { // make direct connection if there is only one product and one reactant
                links.push({
                    source: nodes[reactants[0].getAttribute('species')],
                    target: nodes[products[0].getAttribute('species')],
                    type: 'toProducts'
                });
                // make node invisible
                nodes[reactionName].visible = false;
            }
        });

        // parsing SBML DOM for parameter info


        var w = window.innerWidth * 0.9,
            h = window.innerHeight * 0.7;

        var force = d3.layout.force().nodes(d3.values(nodes)).links(links).size([w, h]).linkDistance(60).linkStrength(1).charge(-300).on("tick", tick).start();

        svg = d3.select("body").append("svg:svg").attr("width", w).attr("height", h).attr("id", "modelGraph");
        // Making a border around SVG drawing area
        svg.append("svg:rect").attr("width", w).attr("height", h).attr("style", "fill:rgb(255,255,255);stroke-width:1;stroke:rgb(0,0,0)");

        // Per-type markers, as they don't inherit styles.
        svg.append("svg:defs").selectAll("marker").data(["toProducts", "licensing", "resolved"]).enter().append("svg:marker").attr("id", String).attr("viewBox", "0 -5 10 10").attr("refX", 15).attr("refY", - 1.5).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("svg:path").attr("d", "M0,-5L10,0L0,5");

        path = svg.append("svg:g").selectAll("path").data(force.links()).enter().append("svg:path").attr("class", function(d) {
            return "link " + d.type;
        }).attr("marker-end", function(d) {
            return "url(#" + d.type + ")";
        });

        circle = svg.append("svg:g").selectAll("circle").data(force.nodes()).enter().append("svg:circle")
        //.attr("r", function(d) {return nodeSize[d.type]; })
        .attr("r", function(d) {
            return getNodeSize(d);
        }).on("click", click).call(force.drag);

        // adding titles to the nodes
        circle.append("title").text(function(d) {
            if (d.type == 'species') {
                var t = 'Initial Concentration: ';
                t += $sbmlDoc.find("listOfSpecies").find('#' + d.name).attr("initialAmount");

                return t;
            }
            else if (d.type == 'reaction') {
                return d.name;
            }
        });

        text = svg.append("svg:g").selectAll("g").data(force.nodes()).enter().append("svg:g");

        // A copy of the text with a thick white stroke for legibility.
        text.append("svg:text").attr("x", 8).attr("y", ".31em").attr("class", "shadow").text(function(d) {
            if (d.type == 'reaction') {
                return "";
            }
            else {
                return d.name;
            }
        });

        text.append("svg:text").attr("x", 8).attr("y", ".31em").text(function(d) {
            if (d.type == 'reaction') {
                return "";
            }
            else {
                return d.name;
            }
        });



        $('body').append('<br/><button type="button" id=btnSimulate>Simulate</button>')

        $('button#btnSimulate').click(function() {
            $('svg#modelGraph').hide('slow');
            $(this).hide('slow');
            var f = function(t, x) {
                return [10 * (x[1] - x[0]),
                x[0] * (28 - x[2]) - x[1],
                x[0] * x[1] - (8 / 3) * x[2]];
            };
            var sol = numeric.dopri(0, 20, [-1, 3, 4], f, 1e-6, 2000);
            numSol = numeric.transpose(sol.y);

            var margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 50
            },
            width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var x = d3.scale.linear().range([0, width]);
            var y = d3.scale.linear().range([height, 0]);
            var xAxis = d3.svg.axis().scale(x).orient("bottom");
            var yAxis = d3.svg.axis().scale(y).orient("left");
            var line = d3.svg.line().x(function(d) {
                return x(d[0]);
            }).y(function(d) {
                return y(d[1]);
            });

            var svg = d3.select("body").append("svg").attr("width", width + margin.left + margin.right).attr("id", "simulationGraph").attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //            d3.tsv("data.tsv", function(error, data) {
            //                data.forEach(function(d) {
            //                    d.date = parseDate(d.date);
            //                    d.close = +d.close;
            //                });
            var preData = numSol.slice(0, 2);
            var data = [];
            for (var i = 0; i<preData[0].length; i++) {
                data[i] = [preData[0][i],preData[1][i]];
            }
            
            //data = preData[0].concat(preData[1]);
            x.domain(d3.extent(data, function(d) {
                return d[0];
            }));
            y.domain(d3.extent(data, function(d) {
                return d[1];
            }));

            svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

            svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("y-axis");

            svg.append("path").datum(data).attr("class", "line").attr("d", line);
            //            });

        });


    });

    var selectedId = $("#selectedId"),
        selectedCompartment = $("#selectedCompartment"),
        selectedInitialAmount = $("#selectedInitialAmount"),
        allFields = $([]).add(selectedId).add(selectedCompartment).add(selectedInitialAmount);

    $("#dialog-form-species").dialog({
        autoOpen: false,
        modal: true,
        buttons: {
            Save: function() {
                links.forEach(function(link) {
                    if (link.target == selectedId.val()) {
                        link.target = selectedId.val();
                    }
                    if (link.source == selectedId.val()) {
                        link.source = selectedId.val();
                    }
                });

                selectedNode.name = selectedId.val();
                selectedNode.compartment = selectedCompartment.val();
                selectedNode.initialAmount = selectedInitialAmount.val();
                $(this).dialog("close");

                // A copy of the text with a thick white stroke for legibility.
                text.append("svg:text").attr("x", 8).attr("y", ".31em").attr("class", "shadow").text(function(d) {
                    if (d.type == 'reaction') {
                        return "";
                    }
                    else {
                        return d.name;
                    }
                });

                text.append("svg:text").attr("x", 8).attr("y", ".31em").text(function(d) {
                    if (d.type == 'reaction') {
                        return "";
                    }
                    else {
                        return d.name;
                    }
                });

            },
            Cancel: function() {
                $(this).dialog("close");
            }
        }
    });



    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });

        circle.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }


    // get node size from the name of the node
    function getNodeSize(node) {
        if (node.type == 'reaction' && node.visible) { //is a reaction node
            return NODESIZE.reaction;
        }
        else if (node.visible) { // is a species node
            return NODESIZE.species;
        }
        else { // node should not be visible
            return 0;
        }
    }

    // return if name is a reactant or product aggregrate
    function isReaction(name) {
        if ($sbmlDoc.find("listOfReactions").find("#" + name).length > 0) {
            return true;
        }
        else {
            return false;
        }
    }


    // Open dialog box on click.
    function click(d) {
        var title;
        selectedNode = d;
        if (isReaction(d.name)) { // selected a reaction node
            title = 'Reaction Node';
            //$('#reactionEquation').children().detach();
            //        $('#reactionEquation').append('<p>The equation for this reaction is:</p>');
            //        var equation = $sbmlDoc.find("#" + d.name).find("math").clone()[0];
            //        $('#reactionEquation').append(equation);
            //$('#reactionEquation').append(printObject(d));

        }
        else { // selected a species node
            title = 'Species Node';

            //$('#reactionEquation').children().detach();
            //        $('#reactionEquation').attr('title', 'Species Node');
            //        $('#reactionEquation').append('<p>The species node you selected is:</p>');
            //        $('#reactionEquation').append('<p>' + d.name + '</p>');
            //        $('#reactionEquation').append('<p></p>');
            // $('#reactionEquation').append(printObject(d));

            $('#selectedId').val(d.name);
            $('#selectedCompartment').val(d.compartment);
            $('#selectedInitialAmount').val(d.initialAmount);
            if (d.boundaryCondition) {
                $('#selectedBoundaryCondition').attr('checked', 'checked');
            }
            else {
                $('#selectedBoundaryCondition').removeAttr('checked');
            }

            $("#dialog-form-species").dialog("open");

        }
        //$('#reactionEquation ').dialog({title: title});
    }

    // Returns string of properties within an object
    function printObject(object) {
        var output = '';
        for (var property in object) {
            output += ' < p > ' + property + ': ' + object[property] + '; < /p>';
        }
        return output;
    }


});
