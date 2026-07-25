declare module "@deck.gl/react" {
  import { Component } from "react";
  import { DeckProps } from "@deck.gl/core";

  export default class DeckGL extends Component<DeckProps> {}
}

declare module "@deck.gl/layers" {
  export { PolygonLayer, ScatterplotLayer } from "@deck.gl/core";
}

declare module "@deck.gl/geo-layers" {
  export { TripsLayer } from "@deck.gl/geo-layers";
}

declare module "deck.gl" {
  export { FlyToInterpolator } from "@deck.gl/core";
}
