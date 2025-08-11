import { Component, AfterViewInit, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
// import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  private map: any;
    
  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  constructor() {}

  ngAfterViewInit(): void {
    const modal = document.getElementById('mapModal');
    modal?.addEventListener('shown.bs.modal', () => {
      this.initMap();
    });
  }

  openMap(): void {
    // const modalElement = document.getElementById('mapModal') as HTMLElement;
    // const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
    // modal.show();
  }

  private initMap(): void {
    
    if (this.map) {
      this.map.invalidateSize();
      return;
    }
  
    // ✅ Cấu hình icon mặc định để tránh lỗi 404
    const iconDefault = L.icon({
      iconUrl: 'assets/leaflet/dist/images/marker-icon.png',
      iconRetinaUrl: 'assets/leaflet/dist/images/marker-icon-2x.png',
      shadowUrl: 'assets/leaflet/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  
    L.Marker.prototype.options.icon = iconDefault;
  
    // ✅ Tạo bản đồ
    this.map = L.map('map').setView([21.0285, 105.8542], 13);
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
  
    // ✅ Thêm GeoSearchControl
    const provider = new OpenStreetMapProvider();
    const searchControl = GeoSearchControl({
      provider: provider,
      style: 'button',
      position: 'topright',
      retainZoomLevel: false, // Giữ mức zoom hiện tại
      keepResult: true, // ✅ Giữ kết quả tìm kiếm
    });
    this.map.addControl(searchControl);
  
    // ✅ Lưu tất cả các marker vào một array để giữ lại sau khi tìm kiếm
    const markers: L.Marker[] = [];
  
    // ✅ Thêm marker khi click bản đồ
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const marker = L.marker([lat, lng], { icon: iconDefault })
        .addTo(this.map)
        .bindPopup('Selected Location')
        .openPopup();
  
      markers.push(marker); // Thêm marker vào array
      this.locationSelected.emit({ lat, lng });
    });
  
    // ✅ Hiển thị vị trí hiện tại
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const currentLocationMarker = L.marker([lat, lng], { icon: iconDefault })
          .addTo(this.map)
          .bindPopup('Your current location')
          .openPopup();
  
        markers.push(currentLocationMarker); // Thêm marker vị trí hiện tại vào array
        this.map.setView([lat, lng], 13);
      });
    }
  
    // ✅ Giữ marker sau khi tìm kiếm
    this.map.on('geosearch/showlocation', (result: any) => {
      const { x, y } = result.location;
      const marker = L.marker([y, x], { icon: iconDefault })
        .addTo(this.map)
        .bindPopup('Search Result')
        .openPopup();
  
      markers.push(marker); // Lưu marker kết quả tìm kiếm
    });
  }
}
