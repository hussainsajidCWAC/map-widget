class leafletMapWidget {
    constructor(wgs84) {
        this.WGS84 = wgs84;
        this.vGrassCuttingSchedule = null;
    }

    showMap() {
        var bSuccess = false;

        var map = null;
        try
        {
            if ((this.WGS84.latitude != 0.0) && (this.WGS84.longitude != 0.0)) {
                map = L.map('widgetmap').setView([this.WGS84.latitude, this.WGS84.longitude], 15);
                bSuccess = true;
            }
        }
        catch (err) {}

        if (!bSuccess) {
            map = L.map('widgetmap').setView([53.213, -2.902], 13);
        }

        var _this = this;
    
        // load a tile layer
        var vMapBox = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: '',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoiamR1bmNhbGYiLCJhIjoiY2wxMHJxMm55MDFiZDNjbnM3cGV3YzF3dyJ9.JwiikZcJsfBr2ebIytXcxw'
        }).addTo(map);

        var vGrassCutting = null;
        
        var vGreenStyle = {
            "color": "#00ff00"
            };
            
        $.ajax({
            url: 'https://fs-filestore-eu.s3.eu-west-1.amazonaws.com/qwest/assets/GeoJSONTest/GrassCutting.geojson',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            type: "GET",
            dataType: "json",
            async: true,
            success: function (result) {

                vGrassCutting = L.geoJson(result, {
                    style: vGreenStyle
                })
                .bindPopup(function (layer) {
                    var vPopupText = layer.feature.properties['Feature_ID'] + " : Missing schedule data.";

                    result = _this.vGrassCuttingSchedule.filter(obj => obj['feature_id'] == layer.feature.properties['Feature_ID']);

                    var today = new Date();
                    var date = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate();
                    var nowDate = Date.parse(today);

                    $.each(result, function(index, value) {
                        var parts = value["date"].split("/");
                        var dt = new Date(
                                        parseInt(parts[2], 10),
                                        parseInt(parts[1], 10) - 1,
                                        parseInt(parts[0], 10)
                                    );

                        let vDateCheck = Date.parse(dt);
                        if (vDateCheck >= nowDate) {
                            vPopupText = "Next scheduled cutting is on the " + value["date"];
                            return false;
                        }
                    });

                    return vPopupText;
                });

                var baseLayers = {
                    "Mapbox": vMapBox
                };
                
                var overlays = {
                    "Grass Cutting": vGrassCutting
                };

                map.addLayer(vGrassCutting);
                L.control.layers(baseLayers, overlays).addTo(map);
            },
            error: function () {
                console.log("error");
            }
        });
    }

    loadCSVData() {

        var _this = this;

        $.ajax({
            url: 'https://fs-filestore-eu.s3.eu-west-1.amazonaws.com/qwest/assets/GeoJSONTest/GrassCuttingSchedule.csv',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            type: "GET",
            dataType: "text",
            async: true,
            success: function (result) {
                _this.vGrassCuttingSchedule = csvJSON(result);
                _this.vGrassCuttingSchedule = sortByKey(_this.vGrassCuttingSchedule, "feature_id");
            },
            error: function () {
                console.log("error");
            }
        });
    }
}

function csvJSON(csv) {

    var lines=csv.split("\r\n");
    
    var result = [];
    
    var headers=lines[0].split(",");
    
    for(var i=1;i<lines.length;i++){
    
        var obj = {};
        var currentline=lines[i].split(",");
    
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
    
        result.push(obj);
    }
    
    return result;
}

function sortByKey(array, key) {
      
    return array.sort((a, b) => {
        let x = a[key];
        let y = b[key];
        
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
