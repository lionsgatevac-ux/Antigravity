// vite.config.js
import { defineConfig } from "file:///C:/Users/Admin/OneDrive/Asztali%20g%C3%A9p/Antigravity/Padl%C3%A1s%20f%C3%B6d%C3%A9m%20szigetel%C3%A9s%20dokumentum%20managment/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Admin/OneDrive/Asztali%20g%C3%A9p/Antigravity/Padl%C3%A1s%20f%C3%B6d%C3%A9m%20szigetel%C3%A9s%20dokumentum%20managment/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/Admin/OneDrive/Asztali%20g%C3%A9p/Antigravity/Padl%C3%A1s%20f%C3%B6d%C3%A9m%20szigetel%C3%A9s%20dokumentum%20managment/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Padl\xE1sf\xF6d\xE9m Szigetel\xE9s - BO-ZSO",
        short_name: "Padl\xE1s Szigetel\xE9s",
        description: "Dokumentum menedzsment rendszer padl\xE1sf\xF6d\xE9m szigetel\xE9si projektekhez",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache-v2",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
                // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBZG1pblxcXFxPbmVEcml2ZVxcXFxBc3p0YWxpIGdcdTAwRTlwXFxcXEFudGlncmF2aXR5XFxcXFBhZGxcdTAwRTFzIGZcdTAwRjZkXHUwMEU5bSBzemlnZXRlbFx1MDBFOXMgZG9rdW1lbnR1bSBtYW5hZ21lbnRcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFkbWluXFxcXE9uZURyaXZlXFxcXEFzenRhbGkgZ1x1MDBFOXBcXFxcQW50aWdyYXZpdHlcXFxcUGFkbFx1MDBFMXMgZlx1MDBGNmRcdTAwRTltIHN6aWdldGVsXHUwMEU5cyBkb2t1bWVudHVtIG1hbmFnbWVudFxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQWRtaW4vT25lRHJpdmUvQXN6dGFsaSUyMGclQzMlQTlwL0FudGlncmF2aXR5L1BhZGwlQzMlQTFzJTIwZiVDMyVCNmQlQzMlQTltJTIwc3ppZ2V0ZWwlQzMlQTlzJTIwZG9rdW1lbnR1bSUyMG1hbmFnbWVudC9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgcmVhY3QoKSxcclxuICAgICAgICBWaXRlUFdBKHtcclxuICAgICAgICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAgICAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAncm9ib3RzLnR4dCcsICdhcHBsZS10b3VjaC1pY29uLnBuZyddLFxyXG4gICAgICAgICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ1BhZGxcdTAwRTFzZlx1MDBGNmRcdTAwRTltIFN6aWdldGVsXHUwMEU5cyAtIEJPLVpTTycsXHJcbiAgICAgICAgICAgICAgICBzaG9ydF9uYW1lOiAnUGFkbFx1MDBFMXMgU3ppZ2V0ZWxcdTAwRTlzJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRG9rdW1lbnR1bSBtZW5lZHpzbWVudCByZW5kc3plciBwYWRsXHUwMEUxc2ZcdTAwRjZkXHUwMEU5bSBzemlnZXRlbFx1MDBFOXNpIHByb2pla3Rla2hleicsXHJcbiAgICAgICAgICAgICAgICB0aGVtZV9jb2xvcjogJyMxZTQwYWYnLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXHJcbiAgICAgICAgICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnL2ljb24tMTkyeDE5Mi5wbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcmM6ICcvaWNvbi01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJy9pY29uLTUxMng1MTIucG5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd29mZjJ9J10sXHJcbiAgICAgICAgICAgICAgICBydW50aW1lQ2FjaGluZzogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9hcGlcXC4vLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyOiAnTmV0d29ya0ZpcnN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnYXBpLWNhY2hlLXYyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgLy8gMjQgaG91cnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIF0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgICBwb3J0OiA1MTczLFxyXG4gICAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTozMDAwJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvaEIsU0FBUyxvQkFBb0I7QUFDampCLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ0osY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGVBQWUsY0FBYyxzQkFBc0I7QUFBQSxNQUNuRSxVQUFVO0FBQUEsUUFDTixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxhQUFhO0FBQUEsUUFDYixPQUFPO0FBQUEsVUFDSDtBQUFBLFlBQ0ksS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1Y7QUFBQSxVQUNBO0FBQUEsWUFDSSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDVjtBQUFBLFVBQ0E7QUFBQSxZQUNJLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNiO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNMLGNBQWMsQ0FBQyxzQ0FBc0M7QUFBQSxRQUNyRCxnQkFBZ0I7QUFBQSxVQUNaO0FBQUEsWUFDSSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDTCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1IsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLO0FBQUE7QUFBQSxjQUM3QjtBQUFBLGNBQ0EsbUJBQW1CO0FBQUEsZ0JBQ2YsVUFBVSxDQUFDLEdBQUcsR0FBRztBQUFBLGNBQ3JCO0FBQUEsWUFDSjtBQUFBLFVBQ0o7QUFBQSxRQUNKO0FBQUEsTUFDSjtBQUFBLElBQ0osQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNILFFBQVE7QUFBQSxRQUNKLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
