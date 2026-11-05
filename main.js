import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorSource } from 'ol/source.js';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj.js';
import { Icon, Style, Stroke, Fill } from 'ol/style.js'; 
import Overlay from 'ol/Overlay.js';

const riau = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON({
      featureProjection: 'EPSG:3857' 
    }),
    url: 'data/polygon_riau.json'
  })
});

const kabRiau = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'data/kab_riau.json',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'FID'],
      1,
      '#ffff33',
      13,
      '#3358ff',
    ],
  },
});

// Untuk menampilkan titik banjir dan icon
const banjir = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON({
      featureProjection: 'EPSG:3857'
    }),
    url: 'data/banjir.json'
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 1],
      anchorXUnits: 'fraction', 
      anchorYUnits: 'fraction',
      src: 'icon/flood.png',
      width: 32,
      height: 32
    })
  })
});

// Layer untuk menampilkan jalur GeoJSON
const jalur = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON({
      featureProjection: 'EPSG:3857'
    }),
    url: 'data/jalur.geojson'
  }),
  style: function (feature) {
    const strokeColor = feature.get('stroke') || '#ff802f'; 
    const strokeWidth = feature.get('stroke-width') || 4;   
    
    return new Style({
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth
      })
    });
  }
});

// Data Titik UMKM (Point)
const umkm = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON({
      featureProjection: 'EPSG:3857'
    }),
    url: 'data/pointumkm.geojson' 
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 1],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      src: 'icon/umkm.png', 
      width: 28,
      height: 28
    })
  })
});

// Area Pusat Keramaian (Polygon)
const areaKeramaian = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON({
      featureProjection: 'EPSG:3857'
    }),
    url: 'data/areaumkm.geojson' 
  }),
  style: function (feature) {
    
    const fillColor = 'rgba(255, 0, 0, 0.4)'; 
    const strokeColor = '#ff0000'; 
    const strokeWidth = 3; 
    
    return new Style({
      fill: new Fill({
        color: fillColor 
      }),
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth
      })
    });
  }
});


// // Element HTML untuk Popup
// const container = document.getElementById('popup');
// const content_element = document.getElementById('popup-content');
// const closer = document.getElementById('popup-closer');

// // Create overlay popup
// const overlay = new Overlay({
//   element: container,
//   autoPan: {
//     animation: {
//       duration: 250,
//     },
//   },
// });

const polygonLayerCheckbox = document.getElementById('polygon');
const pointLayerCheckbox = document.getElementById('point');
const jalurLayerCheckbox = document.getElementById('jalur');

polygonLayerCheckbox.addEventListener('change', function() {
  const isChecked = polygonLayerCheckbox.checked;
  
  kabRiau.setVisible(isChecked);
  areaKeramaian.setVisible(isChecked);
});

pointLayerCheckbox.addEventListener('change', function() {
const isChecked = pointLayerCheckbox.checked;
  
  banjir.setVisible(isChecked);
  umkm.setVisible(isChecked);
});

if (jalurLayerCheckbox) {
  jalurLayerCheckbox.addEventListener('change', function() {
    jalur.setVisible(jalurLayerCheckbox.checked);
  });
}

const popup = new Overlay({
  element: document.getElementById('popup'),
  positioning: 'top-center',
  stopEvent: false,
  offset: [0, -15]
});
// Inisialisasi Map
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    riau, 
    kabRiau,       
    banjir,
    areaKeramaian,
    jalur,
    umkm
  ],
  overlays: [popup],
  view: new View({
    center: fromLonLat([101.450314, 0.445676]),
    zoom: 8,
  }),
});

map.addOverlay(popup);

// Event listener untuk mendeteksi klik pada fitur peta dan menampilkan popup
map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feat) {
    return feat;
  });

  // Jika yang diklik bukan fitur peta, tutup popup dan berhenti
  if (!feature) {
    popup.setPosition(undefined);
    return;
  }

  // Menentukan posisi penempatan popup berdasarkan tipe geometri
  let popupCoordinates;
  const geometry = feature.getGeometry();
  const geomType = geometry.getType();

  if (geomType === 'Point') {
    popupCoordinates = geometry.getCoordinates();
  } else if (geomType === 'LineString') {
    popupCoordinates = geometry.getCoordinateAt(0.5); // Ambil titik tengah jalur
  } else {
    popupCoordinates = evt.coordinate; // Titik klik mouse untuk Polygon
  }

  let content = '';

  // LOGIKA DIAGNOSTIK POPUP BERDASARKAN ATRIBUT GEOJSON
  if (feature.get('Omzet Range')) {
    // 1. Point UMKM
    const namaToko = feature.get('Title') || feature.get('Description') || 'Tanpa Nama';
    const jenis = feature.get('Jenis') || '-';
    const omzet = feature.get('Omzet Range') || '-';
    const digital = feature.get('Digitalisasi') || '-';
    const pasar = feature.get('Market Place') || feature.get('Marketplace') || '-';
    const pelanggan = feature.get('Pelanggan') || '-';
    const pekerja = feature.get('Jumlah Pekerja') || feature.get('Jumlah pekerja') || '-';
    const lamaUsaha = feature.get('Lama Usaha') || feature.get('Lama usaha') || '-';

    content = '<h3>' + namaToko + ' (' + jenis + ')</h3>' +
              '<p><b>Lama Usaha:</b> ' + lamaUsaha + '</p>' +
              '<p><b>Jumlah Pekerja:</b> ' + pekerja + ' orang</p>' +
              '<p><b>Omzet:</b> ' + omzet + '</p>' +
              '<p><b>Pembayaran:</b> ' + digital + '</p>' +
              '<p><b>Marketplace:</b> ' + pasar + '</p>' +
              '<p><b>Target Pasar:</b> ' + pelanggan + '</p>';

  } else if (feature.get('name') && feature.get('fill')) {
    // 2. Area Pusat Keramaian
    const namaArea = feature.get('name');
    const waktuBuat = feature.get('timestamp') || '-';
    
    content = '<h3>Wilayah: ' + namaArea + '</h3>' +
              '<p><b>Kategori:</b> Pusat Keramaian / Komersial</p>' +
              '<p><b>Diperbarui:</b> ' + waktuBuat + '</p>';

  } else if (feature.get('name')) {
    // 3. Jalur UMKM / Evakuasi
    const namaJalur = feature.get('name');
    const foto = feature.get('pdfmaps_photos') || '';
    
    content = '<h3>Nama Jalur: ' + namaJalur + '</h3>';
    if (foto) {
      content += '<div class="popup-photos">' + foto + '</div>';
    }

  } else if (feature.get('Nama_Pemetaan')) {
    // 4. Titik Banjir
    const namaDaerah = feature.get('Nama_Pemetaan') || 'Tidak Diketahui';
    const jumlahKorban = feature.get('Jumlah_Korban') || 0;
    
    content = '<h3>Nama Daerah: ' + namaDaerah + '</h3>' + 
              '<p><b>Jumlah Korban:</b> ' + jumlahKorban + ' orang</p>';

  } else if (feature.get('Kabupaten')) {
    // 5. Polygon Kabupaten
    const kab = feature.get('Kabupaten');
    content = '<h3>Kabupaten/Kota: ' + kab + '</h3>';

  } else {
    // 6. Default Layer Wilayah Riau
    content = '<h3>Wilayah Provinsi Riau</h3>';
  }

  // Tampilkan konten pada elemen popup
  document.getElementById('popup-content').innerHTML = content;
  popup.setPosition(popupCoordinates);
});

const featureOverlay = new VectorLayer({
    source: new VectorSource(),
    map: map,
    style: {
        'stroke-color': 'rgba(255, 255, 255, 0.7)',
        'stroke-width': 2,
    },
});

let highlight;

const highlightFeature = function (pixel) {
    const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
        return feature;
    });

    if (feature !== highlight) {
        if (highlight) {
            featureOverlay.getSource().removeFeature(highlight);
        }
        if (feature) {
            featureOverlay.getSource().addFeature(feature);
        }
        highlight = feature;
    }
};

const displayFeatureInfo = function (pixel) {
    const feature = map.forEachFeatureAtPixel(pixel, function (feat) {
        return feat;
    });

    const info = document.getElementById('info');

    if (feature) {
    // Menampilkan nama di elemen info hover sesuai atribut yang tersedia
    const infoText = feature.get('Nama') || feature.get('nama') || feature.get('Kabupaten') || feature.get('Nama_Pemetaan') || 'Fitur Terpilih';
    info.innerHTML = infoText;
  } else {
    info.innerHTML = '&nbsp;';
  }
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
popup.setPosition(undefined);
}
  const pixel = map.getEventPixel(evt.originalEvent)
;
  highlightFeature(pixel);
  displayFeatureInfo(pixel);
});


// // JS untuk mendeteksi klik pada marker/garis dan menampilkan ppup
// map.on('singleclick', function (evt) {
//   const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
//     return feature;
//   });

//   // Jika yang diklik bukan fitur peta, tutup popup lama dan berhenti
//   if (!feature) {
//     overlay.setPosition(undefined);
//     return;
//   }

//   const coordinate = evt.coordinate;
//   let content = '';
  
//   // LOGIKA DIAGNOSTIK POPUP BERDASARKAN ATRIBUT LAYER
//   if (feature.get('Omzet Range')) {
//     // 1. Kondisi jika yang diklik adalah titik UMKM (source 1)
//     const namaToko = feature.get('Title') || feature.get('Description') || 'Tanpa Nama';
//     const jenis = feature.get('Jenis') || '-';
//     const omzet = feature.get('Omzet Range') || '-';
//     const digital = feature.get('Digitalisasi') || '-';
//     const pasar = feature.get('Market Place') || feature.get('Marketplace') || '-';
//     const pelanggan = feature.get('Pelanggan') || '-';
    
//     // Penanganan proteksi perbedaan besar/kecil huruf nama field dari data Anda
//     const pekerja = feature.get('Jumlah Pekerja') || feature.get('Jumlah pekerja') || '-';
//     const lamaUsaha = feature.get('Lama Usaha') || feature.get('Lama usaha') || '-';

//     content = '<h3>' + namaToko + ' (' + jenis + ')</h3>' +
//               '<p><b>Lama Usaha:</b> ' + lamaUsaha + '</p>' +
//               '<p><b>Jumlah Pekerja:</b> ' + pekerja + ' orang</p>' +
//               '<p><b>Omzet:</b> ' + omzet + '</p>' +
//               '<p><b>Pembayaran:</b> ' + digital + '</p>' +
//               '<p><b>Marketplace:</b> ' + pasar + '</p>' +
//               '<p><b>Target Pasar:</b> ' + pelanggan + '</p>';

//   } else if (feature.get('name') && feature.get('fill')) {
//     // 2. Kondisi jika yang diklik adalah Area Pusat Keramaian (source 2)
//     const namaArea = feature.get('name');
//     const waktuBuat = feature.get('timestamp') || '-';
    
//     content = '<h3>Wilayah: ' + namaArea + '</h3>' +
//               '<p><b>Kategori:</b> Pusat Keramaian / Komersial</p>' +
//               '<p><b>Diperbarui:</b> ' + waktuBuat + '</p>';

//   } else if (feature.get('name')) {
//     // 3. Kondisi jika yang diklik adalah Jalur Evakuasi (LineString)
//     const namaJalur = feature.get('name');
//     const foto = feature.get('pdfmaps_photos') || '';
//     content = '<h3>Nama Jalur: ' + namaJalur + '</h3>' + 
//               '<div class="popup-photos">' + foto + '</div>';

//   } else if (feature.get('Nama_Pemetaan')) {
//     // 4. Kondisi jika yang diklik adalah Layer Banjir
//     const namaDaerah = feature.get('Nama_Pemetaan') || 'Tidak Diketahui';
//     const jumlahKorban = feature.get('Jumlah_Korban') || 0;
//     content = '<h3>Nama Daerah: ' + namaDaerah + '</h3>' + 
//               '<p>Jumlah Korban: ' + jumlahKorban + ' orang</p>';

//   } else {
//     // 5. Default Wilayah Riau
//     content = '<h3>Wilayah Provinsi Riau</h3>';
//   }
                  
//   content_element.innerHTML = content;
//   overlay.setPosition(coordinate);
// });

// Handler klik tombol close (X) untuk menyembunyikan popup
// closer.onclick = function () {
//   overlay.setPosition(undefined);
//   closer.blur();
//   return false;
// };
