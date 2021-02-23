import React, {Component} from 'react';

import {get, map} from 'lodash';
import {Map, Marker, Polygon, Popup, TileLayer,} from 'react-leaflet';
import FreeDraw, {CREATE, NONE} from 'leaflet-freedraw';
import {Typography} from 'antd';
import PropTypes from 'prop-types';

const { Text } = Typography;

const freeDraw = new FreeDraw();

export const polygonFromLatLngs = (latLngs) => ({
  type: 'polygon',
  geometry: map(latLngs, (shape) => map(shape, (point) => [point.lat, point.lng])),
});

class MapTool extends Component {
  constructor(prop) {
    super(prop);
    this.state = {
      lat: get(this.props, 'center[0]', 47.6202),
      lng: get(this.props, 'center[1]', -122.3472),
      zoom: get(this.props, 'zoomLevel', 13),
      markers: [],
      objects: this.props.objects,
      mode: 'NONE',
      width: '100vw',
      height: '100vh',
    };
  }

  componentDidMount() {
    this.map = this.leafletMap.leafletElement;
    this.map.addLayer(freeDraw);

    this.setState({
      mode: this.props.mode,
      width: '100%',
      height: '100%',
    });
    this.changeMode(this.props.mode);

    freeDraw.on('markers', (event) => {
      this.handleFeatureDrawn(event);
    });
  }

  componentDidUpdate(prevProps) {
    const { mode, objects } = this.props;
    if (prevProps.objects !== objects) {
      this.setState({ objects: objects });
    }
    if (prevProps.mode !== mode) {
      this.setState({ mode: mode });
      this.changeMode(mode);
    }
  }

  componentWillUnmount() {
    this.map.removeLayer(freeDraw);
  }

  handleFeatureDrawn(event) {
    if (event.eventType !== 'clear') {
      if (event.latLngs !== undefined || event.latLngs.length !== 0) {
        const { onFeatureDrawn } = this.props;
        onFeatureDrawn(polygonFromLatLngs(event.latLngs));
        freeDraw.clear();
      }
    }
  }

  changeMode(mode) {
    if (mode === 'NONE') {
      freeDraw.mode(NONE);
    }
    if (mode === 'CREATE') {
      freeDraw.mode(CREATE);
    }
  }

  render() {
    const {
      mode, lat, lng, zoom, width, height, objects,
    } = this.state;
    const position = [lat, lng];
    const {tileURL, markers, tileAttribution} = this.props;
    return (
      <Map
        style={{
          width,
          height,
          touchAction: 'none',
        }}
        center={position}
        zoom={zoom}
        draggable={mode === 'NONE'}
        ref={(m) => { this.leafletMap = m; }}
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileURL}
        />
        {
          map(objects, (object, idx) => (
            <Polygon
              key={idx}
              color="#b1ef8d"
              positions={object.GISObject.data}
            />
          ))
        }

        {
          map(markers, (marker, idx) => (
            <Marker key={idx} position={[marker.lat, marker.lng]}>
              <Popup>
                <Typography>
                  <Text>
                    {marker.lat}
                    ,
                    {marker.lng}
                  </Text>
                </Typography>
              </Popup>
            </Marker>
          ))
        }
      </Map>
    );
  }
}

MapTool.propTypes = {
  tileURL: PropTypes.string,
  tileAttribution: PropTypes.string,
  onFeatureDrawn: PropTypes.func.isRequired,
};

MapTool.defaultProps = {
  tileURL: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}{r}.png',
  tileAttribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
};

export default MapTool;
