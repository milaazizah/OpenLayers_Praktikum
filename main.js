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

// Untuk menampilkan polygon Riau dengan data .json
const riau = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON({
      featureProjection: 'EPSG:3857' 
    }),
    url: 'data/polygon_riau.json'
  })
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


// Element HTML untuk Popup
const container = document.getElementById('popup');
const content_element = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

// Create overlay popup
const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

// Inisialisasi Map
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }), 
    riau, 
    areaKeramaian, 
    banjir,
    jalur,
    umkm
  ],
  overlays: [overlay], 
  view: new View({
    center: fromLonLat([101.450314, 0.445676]), 
    zoom: 13, 
  }),
});

// JS untuk mendeteksi klik pada marker/garis dan menampilkan popup
map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });

  // Jika yang diklik bukan fitur peta, tutup popup lama dan berhenti
  if (!feature) {
    overlay.setPosition(undefined);
    return;
  }

  const coordinate = evt.coordinate;
  let content = '';
  
  // LOGIKA DIAGNOSTIK POPUP BERDASARKAN ATRIBUT LAYER
  if (feature.get('Omzet Range')) {
    // 1. Kondisi jika yang diklik adalah titik UMKM (source 1)
    const namaToko = feature.get('Title') || feature.get('Description') || 'Tanpa Nama';
    const jenis = feature.get('Jenis') || '-';
    const omzet = feature.get('Omzet Range') || '-';
    const digital = feature.get('Digitalisasi') || '-';
    const pasar = feature.get('Market Place') || feature.get('Marketplace') || '-';
    const pelanggan = feature.get('Pelanggan') || '-';
    
    // Penanganan proteksi perbedaan besar/kecil huruf nama field dari data Anda
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
    // 2. Kondisi jika yang diklik adalah Area Pusat Keramaian (source 2)
    const namaArea = feature.get('name');
    const waktuBuat = feature.get('timestamp') || '-';
    
    content = '<h3>Wilayah: ' + namaArea + '</h3>' +
              '<p><b>Kategori:</b> Pusat Keramaian / Komersial</p>' +
              '<p><b>Diperbarui:</b> ' + waktuBuat + '</p>';

  } else if (feature.get('name')) {
    // 3. Kondisi jika yang diklik adalah Jalur Evakuasi (LineString)
    const namaJalur = feature.get('name');
    const foto = feature.get('pdfmaps_photos') || '';
    content = '<h3>Nama Jalur: ' + namaJalur + '</h3>' + 
              '<div class="popup-photos">' + foto + '</div>';

  } else if (feature.get('Nama_Pemetaan')) {
    // 4. Kondisi jika yang diklik adalah Layer Banjir
    const namaDaerah = feature.get('Nama_Pemetaan') || 'Tidak Diketahui';
    const jumlahKorban = feature.get('Jumlah_Korban') || 0;
    content = '<h3>Nama Daerah: ' + namaDaerah + '</h3>' + 
              '<p>Jumlah Korban: ' + jumlahKorban + ' orang</p>';

  } else {
    // 5. Default Wilayah Riau
    content = '<h3>Wilayah Provinsi Riau</h3>';
  }
                  
  content_element.innerHTML = content;
  overlay.setPosition(coordinate);
});

// Handler klik tombol close (X) untuk menyembunyikan popup
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};
