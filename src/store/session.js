import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'session',
  initialState: {
    server: null,
    user: null,
    socket: null,
    includeLogs: false,
    logs: [],
    positions: {},
    history: {},
  },
  reducers: {
    updateServer(state, action) {
      state.server = action.payload;
    },
    updateUser(state, action) {
      state.user = action.payload;
    },
    updateSocket(state, action) {
      state.socket = action.payload;
    },
    enableLogs(state, action) {
      state.includeLogs = action.payload;
      if (!action.payload) {
        state.logs = [];
      }
    },
    updateLogs(state, action) {
      state.logs.push(...action.payload);
    },

    updatePositions(state, action) {
      const liveRoutes = state.user.attributes.mapLiveRoutes || state.server.attributes.mapLiveRoutes || 'none';
      const liveRoutesLimit = state.user.attributes['web.liveRouteLength'] || state.server.attributes['web.liveRouteLength'] || 10;
    
      action.payload.forEach((position) => {
        const deviceId = position.deviceId;
        const newFixTime = new Date(position.fixTime).getTime();
    
        state.positions[deviceId] = position;
    
        if (liveRoutes !== 'none') {
          let route = state.history[deviceId] || [];
    
          // Yeni konum kuyrukta zaten yoksa
          const last = route.at(-1);
          if (!last || (last[0] !== position.longitude || last[1] !== position.latitude)) {
            // Yeni konumu başa alalım
            route.push([position.longitude, position.latitude, newFixTime]);
    
            // Yeni konuma göre geçmişi filtrele (sadece son 20 saniye)
            route = route.filter(([, , fixTime]) => newFixTime - fixTime <= 60000);
    
            // Limit uygula
            state.history[deviceId] = route.slice(-liveRoutesLimit);
          }
        } else {
          state.history = {};
        }
      });
    }
    
  },
});

export { actions as sessionActions };
export { reducer as sessionReducer };
