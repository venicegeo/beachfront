/**
 * Copyright 2016, RadiantBlue Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import Control from 'ol/control/control'
import proj from 'ol/proj'

const DMS_PREFIX = /^([NS]|[+-])(\d{2})(\d{2})(\d{2})\s*([EW]|[+-])(\d{2,3})(\d{2})(\d{2})$/i
const DMS_POSTFIX = /^(\d{2})(\d{2})(\d{2})([NS])\s*(\d{2,3})(\d{2})(\d{2})([EW])$/i
const DECIMAL = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
const MGRS = /^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z])([A-HJ-NP-V])\s*(\d{1,5}\s*\d{1,5})$/i
const UTM_COMMA_PREFIX = /^(\d{1,2})?([A-Z]),?\s*(\d{5,6}\.?\d*),\s*(\d{1,7}\.?\d*)$/i
const UTM_SPACE_PREFIX = /^(\d{1,2})?([A-Z])\s+(\d{5,6}\.?\d*)\s+(\d{1,7}\.?\d*)$/i
const UTM_COMMA_POSTFIX = /^(\d{5,6}\.?\d*),\s*(\d{1,7}\.?\d*),?\s*(\d{1,2})?([A-Z])$/i
const UTM_SPACE_POSTFIX = /^(\d{5,6}\.?\d*)\s+(\d{1,7}\.?\d*)\s+(\d{1,2})?([A-Z])$/i
const TEMPLATE_DMS = '{{lat_hours}}{{lat_minutes}}{{lat_seconds}}{{lat_hemisphere}}{{lon_hours}}{{lon_minutes}}{{lon_seconds}}{{lon_hemisphere}}'
const TEMPLATE_DIALOG = `
<div style="display: flex; position: relative;">
  <input placeholder="Enter Coordinates" style="flex: 1; font-size: inherit; border: none; background-color: #eee;" name="coordinate">
  <button type="submit" style="border: none; background-color: transparent; width: 2em; line-height: 2em; font-size: 1em; color: #555;"><i class="fa fa-search" style="vertical-align: text-top;"></i></button>
  <button class="closeButton" type="reset" style="border: none; background-color: transparent; width: 2em; line-height: 2em; font-size: 1em; color: #555;"><i class="fa fa-close"></i></button>
</div>
<h3 class="error-message" style="display: none; margin-top: .25em; padding: 1em; background-color: #f03; text-align: center; font-size: inherit; color: white;">Invalid entry</h3>
<div style="margin-top:.25em; font-size: .9em;">
  Examples of valid coordinates are:
  <dl style="display: flex; flex-wrap: wrap; margin: 0;">
    <dt style="width: 45%; text-align: right; color: #888;">Decimal (Lat, Lon):</dt>
    <dd style="margin-left: .5em;"><code>30, 30</code></dd>
    <dt style="width: 45%; text-align: right; color: #888;">DMS:</dt>
    <dd style="margin-left: .5em;"><code>300000N0300000E</code></dd>
    <dt style="width: 45%; text-align: right; color: #888;">MGRS:</dt>
    <dd style="margin-left: .5em;"><code>36R TU 1059022575</code></dd>
    <dt style="width: 45%; text-align: right; color: #888;">UTM:</dt>
    <dd style="margin-left: .5em;"><code>36N 210590,3322575</code></dd>
  </dl>
</div>`

export class SearchControl extends Control {
  private _dialog: any

  constructor(className: string) {
    const element = document.createElement('div')
    super({element})
    element.className = `${className || ''} ol-unselectable ol-control`
    element.title = 'Jump to a specific location or coordinate'
    element.innerHTML = '<button><i class="fa fa-search"/></button>'
    element.addEventListener('click', () => this._searchClicked())
    element.addEventListener('keyup', (event) => this._escPressed(event))
  }

  getDialog() {
    if (!this._dialog) {
      this._dialog = document.createElement('form')
      this._dialog.className = 'coordinate-dialog'
      this._dialog.style.display = 'block'
      this._dialog.style.position = 'absolute'
      this._dialog.style.top = '300px'
      this._dialog.style.left = '50%'
      this._dialog.style.transform = 'translateX(-50%)'
      this._dialog.style.fontSize = '16px'
      this._dialog.style.backgroundColor = 'white'
      this._dialog.style.padding = '.25em'
      this._dialog.style.width = '350px'
      this._dialog.style.boxShadow = '0 0 0 1px rgba(0,0,0,.2), 0 5px rgba(0,0,0,.1)'
      this._dialog.style.borderRadius = '2px'

      this._dialog.innerHTML = TEMPLATE_DIALOG
      this._dialog.addEventListener('submit', (event: Event) => this._formSubmitted(event))
      this._dialog.addEventListener('reset', () => this._formReset())
      this.getMap().getTargetElement().appendChild(this._dialog)

      const closeDialog = this._dialog.querySelector('.closeButton')
      closeDialog.addEventListener('click', () => this._closeDialog())
    }
    return this._dialog
  }

  _formSubmitted(event: Event) {
    event.preventDefault()
    const input = this._dialog.querySelector('input')
    const errorMessage = this._dialog.querySelector('.error-message')
    try {
      const {longitude, latitude} = Coordinate.parseAny(input.value.trim())
      const view = this.getMap().getView()
      view.setCenter(proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'))
      view.setZoom(8)
      this._closeDialog()
    }
    catch (error) {
      // FIXME: this will catch more than just coordinate errors.
      console.error(error)
      errorMessage.style.display = 'block'
      input.style.backgroundColor = '#fdd'
    }
  }

  _formReset() {
    const input = this._dialog.querySelector('input')
    input.style.backgroundColor = '#eee'
    input.style.color = 'black'
    const errorMessage = this._dialog.querySelector('.error-message')
    errorMessage.style.display = 'none'
  }

  _escPressed(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this._closeDialog()
    }
  }

  _closeDialog() {
    this._dialog.reset()
    this._dialog.style.display = 'none'
  }

  _searchClicked() {
    this.getDialog().style.display = 'block'
  }
}

//
// Helpers
//

class Coordinate {
  latitude: number
  longitude: number

  constructor(latitude: number, longitude: number) {
    const truncate = (n: number) => Math.round(n * 1000000) / 1000000

    // Validate the inputs
    const invalidConditions: string[] = []
    if (isNaN(latitude)) {
      invalidConditions.push('Latitude is not a number')
    }
    if (isNaN(longitude)) {
      invalidConditions.push('Longitude is not a number')
    }
    if (Math.abs(latitude) > 90) {
      invalidConditions.push('Latitude must be between -90 and 90')
    }
    if (Math.abs(longitude) > 180) {
      invalidConditions.push('Longitude must be between -180 and 180')
    }
    if (invalidConditions.length) {
      throw new Error('Could not create coordinate: ' + invalidConditions.join('; '))
    }

    this.latitude = truncate(latitude)
    this.longitude = truncate(longitude)
  }

  toString() {
    return Coordinate.formatDms(this)
  }

  static formatDms(coord: { latitude: number, longitude: number }) {
    const pad = (input: number, depth: number) => ('0000000000' + input).slice(-depth)
    const values: any = {}

    // Determine the hemispheres
    values.lat_hemisphere = (coord.latitude >= 0) ? 'N' : 'S'
    values.lon_hemisphere = (coord.longitude >= 0) ? 'E' : 'W'

    const latitudeDecimal = Math.abs(coord.latitude)
    const longitudeDecimal = Math.abs(coord.longitude)

    values.lat_hours = pad(Math.floor(latitudeDecimal), 2)
    values.lat_minutes = pad(Math.floor(latitudeDecimal * 60) % 60, 2)
    values.lat_seconds = pad(Math.floor(latitudeDecimal * 3600) % 60, 2)

    values.lon_hours = pad(Math.floor(longitudeDecimal), 3)
    values.lon_minutes = pad(Math.floor(longitudeDecimal * 60) % 60, 2)
    values.lon_seconds = pad(Math.floor(longitudeDecimal * 3600) % 60, 2)

    let buffer = TEMPLATE_DMS

    Object.keys(values).forEach(key => buffer = buffer.replace('{{' + key + '}}', values[key]))

    return buffer
  }

  /**
   * Creates a Coordinate from Decimal inputs
   *
   * @param {int} latitude
   * @param {int} longitude
   * @returns {Coordinate}
   */
  static fromDecimal(latitude: number, longitude: number) {
    return new Coordinate(latitude, longitude)
  }

  /**
   * Creates a Coordinate from DMS inputs
   *
   * @param {string} latitudeHemisphere
   * @param {int} latitudeHours
   * @param {int} latitudeMinutes
   * @param {int} latitudeSeconds
   * @param {string} longitudeHemisphere
   * @param {int} longitudeHours
   * @param {int} longitudeMinutes
   * @param {int} longitudeSeconds
   * @returns {Coordinate}
   */
  static fromDms(latitudeHemisphere: string, latitudeHours: number, latitudeMinutes: number, latitudeSeconds: number,
                 longitudeHemisphere: string, longitudeHours: number, longitudeMinutes: number, longitudeSeconds: number) {
    let latitudeDecimal, longitudeDecimal

    // Calculate the latitude
    latitudeDecimal = Math.floor(latitudeHours)
    latitudeDecimal += Math.floor(latitudeMinutes) / 60.0
    latitudeDecimal += Math.floor(latitudeSeconds) / 3600.0
    latitudeDecimal *= ('S' === latitudeHemisphere) ? -1.0 : 1.0

    longitudeDecimal = Math.floor(longitudeHours)
    longitudeDecimal += Math.floor(longitudeMinutes) / 60.0
    longitudeDecimal += Math.floor(longitudeSeconds) / 3600.0
    longitudeDecimal *= ('W' === longitudeHemisphere) ? -1.0 : 1.0

    return new Coordinate(latitudeDecimal, longitudeDecimal)
  }

  /**
   * Creates a Coordinate from MGRS inputs
   *
   * @param {int} zone
   * @param {string} latitudeBand
   * @param {string} column
   * @param {string} row
   * @param {int} easting
   * @param {int} northing
   * @returns {Coordinate}
   */
  static fromMgrs(zone: number, latitudeBand: string, column: string, row: string, easting: number, northing: number) {
    const EASTING_IDS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const NORTHING_IDS = 'ABCDEFGHJKLMNPQRSTUV'
    let utmEasting,
        utmNorthing,
        hemisphere,
        set,
        eastingIndex,
        northingIndex,
        northingModifier,
        eastingModifier,
        northingOffsets: {[key: string]: number},
        minimumNorthing

    // Normalize the inputs
    zone = Math.floor(zone)
    latitudeBand = latitudeBand.toUpperCase().replace(/\s+/g, '')
    column = column.toUpperCase().replace(/\s+/g, '')
    row = row.toUpperCase().replace(/\s+/g, '')
    easting = Math.floor(easting)
    northing = Math.floor(northing)

    /*
     * MGRS TO UTM FORMULA
     *
     * Source:
     *     https://github.com/barryhunter/kml-mgrs-gridlines/blob/master/grid_mgrs/phpcoord-mgrs.php
     *
     * License:
     *     GPL
     *
     * Notes:
     * 2014-04-18 - After a lot of fruitless research on MGRS-to-decimal, it
     *     looks like the strategy I've found to perform the conversion is
     *     to go from MGRS -> UTM -> Decimal.  That is the strategy used
     *     here.
     *
     *     The original source code has been modified in an attempt to add
     *     clarity to what is actually happening.
     */

    set = ((zone - 1) % 6) + 1

    eastingIndex = EASTING_IDS.indexOf(column) + 1
    eastingModifier = (eastingIndex - (8 * ((set - 1) % 3))) * 100000.0

    northingIndex = NORTHING_IDS.indexOf(row)
    // Northing ID offset for sets 2, 4 and 6
    if (set % 2 === 0) {
      northingIndex -= 5
    }
    if (northingIndex < 0) {
      northingIndex += 20
    }

    northingModifier = northingIndex * 100000.0
    northingModifier = (northingModifier % 1000000) * 1.0

    northingOffsets = {
      'C': 1100000.0,
      'D': 2000000.0,
      'E': 2800000.0,
      'F': 3700000.0,
      'G': 4600000.0,
      'H': 5500000.0,
      'J': 6400000.0,
      'K': 7300000.0,
      'L': 8200000.0,
      'M': 9100000.0,
      'N': 0.0,
      'P': 800000.0,
      'Q': 1700000.0,
      'R': 2600000.0,
      'S': 3500000.0,
      'T': 4400000.0,
      'U': 5300000.0,
      'V': 6200000.0,
      'W': 7000000.0,
      'X': 7900000.0,
    }

    minimumNorthing = northingOffsets[latitudeBand]
    while (northingModifier < minimumNorthing) {
      northingModifier += 1000000
    }

    hemisphere = NORTHING_IDS.indexOf(latitudeBand) >= NORTHING_IDS.indexOf('N') ? 'N' : 'S'
    utmEasting = eastingModifier + easting
    utmNorthing = northingModifier + northing

    return Coordinate.fromUtm(zone, hemisphere, utmEasting, utmNorthing)
  }

  /**
   * Creates a Coordinate from UTM inputs
   *
   * @param {int} zone
   * @param {string} hemisphere
   * @param {number} easting
   * @param {number} northing
   * @returns {Coordinate}
   */
  static fromUtm(zone: number, hemisphere: string, easting: number, northing: number) {
    const deg2rad = (n: number) => (n / 180.0 * Math.PI)
    const rad2deg = (n: number) => (n / Math.PI * 180.0)
    const SCALE_FACTOR = 0.9996
    const WGS84_ELLIPSOID_MAJAXIS = 6378137.0
    const WGS84_ELLIPSOID_MINAXIS = 6356752.314
    let latitudeDecimal,
        longitudeDecimal,
        centralMeridian,
        x,
        y,
        n,
        y_,
        alpha_,
        beta_,
        gamma_,
        delta_,
        epsilon_,
        phif,
        ep2,
        cf,
        nuf2,
        Nf,
        Nfpow,
        tf,
        tf2,
        tf4,
        x1frac,
        x2frac,
        x3frac,
        x4frac,
        x5frac,
        x6frac,
        x7frac,
        x8frac,
        x2poly,
        x3poly,
        x4poly,
        x5poly,
        x6poly,
        x7poly,
        x8poly

    // Normalize the inputs
    zone = Math.floor(zone)
    hemisphere = hemisphere.toUpperCase().replace(/\s+/g, '')
    easting = Math.floor(easting)
    northing = Math.floor(northing)

    /*
     * UTM XY TO DECIMAL FORMULA
     *
     * Source:
     * http://home.hiwaay.net/~taylorc/toolbox/geography/geoutm.html
     *
     * License:
     * None
     *
     * Notes:
     * 2014-04-17 - This formula does not handle corner cases very well.
     *     Attempting to parse the UTM-equivalent of the following
     *     coordinates will fail spectacularly:
     *
     *         - N90.0 W180.0
     *         - S90.0 E180.0
     *
     *     Not that anyone would actually use those coordinates (and I'm not
     *     even sure they are valid in the first place), but this is
     *     something to be aware of.
     */

    centralMeridian = deg2rad(-183 + (zone * 6))

    // Calculate X, Y values from eastern and northing
    x = (easting - 500000.0) / SCALE_FACTOR
    y = ('S' === hemisphere)
      ? (northing - 10000000.0) / SCALE_FACTOR
      : northing / SCALE_FACTOR

    // Hold on to your freakin hat because here we go
    n = (WGS84_ELLIPSOID_MAJAXIS - WGS84_ELLIPSOID_MINAXIS) / (WGS84_ELLIPSOID_MAJAXIS + WGS84_ELLIPSOID_MINAXIS)

    /* Precalculate alpha_ (Eq. 10.22) */
    /* (Same as alpha in Eq. 10.17) */
    alpha_ = ((WGS84_ELLIPSOID_MAJAXIS + WGS84_ELLIPSOID_MINAXIS) / 2.0)
      * (1 + (Math.pow(n, 2.0) / 4) + (Math.pow(n, 4.0) / 64))

    /* Precalculate y_ (Eq. 10.23) */
    y_ = y / alpha_

    /* Precalculate beta_ (Eq. 10.22) */
    beta_ = (3.0 * n / 2.0) + (-27.0 * Math.pow(n, 3.0) / 32.0)
      + (269.0 * Math.pow(n, 5.0) / 512.0)

    /* Precalculate gamma_ (Eq. 10.22) */
    gamma_ = (21.0 * Math.pow(n, 2.0) / 16.0)
      + (-55.0 * Math.pow(n, 4.0) / 32.0)

    /* Precalculate delta_ (Eq. 10.22) */
    delta_ = (151.0 * Math.pow(n, 3.0) / 96.0)
      + (-417.0 * Math.pow(n, 5.0) / 128.0)

    /* Precalculate epsilon_ (Eq. 10.22) */
    epsilon_ = (1097.0 * Math.pow(n, 4.0) / 512.0)

    /* Now calculate the sum of the series (Eq. 10.21) */
    phif = y_ + (beta_ * Math.sin(2.0 * y_)) // Referred to as "footpoint latitude"
      + (gamma_ * Math.sin(4.0 * y_))
      + (delta_ * Math.sin(6.0 * y_))
      + (epsilon_ * Math.sin(8.0 * y_))

    /* Precalculate ep2 */
    ep2 = (Math.pow(WGS84_ELLIPSOID_MAJAXIS, 2.0) - Math.pow(WGS84_ELLIPSOID_MINAXIS, 2.0))
      / Math.pow(WGS84_ELLIPSOID_MINAXIS, 2.0)

    /* Precalculate cos (phif) */
    cf = Math.cos(phif)

    /* Precalculate nuf2 */
    nuf2 = ep2 * Math.pow(cf, 2.0)

    /* Precalculate Nf and initialize Nfpow */
    Nf = Math.pow(WGS84_ELLIPSOID_MAJAXIS, 2.0) / (WGS84_ELLIPSOID_MINAXIS * Math.sqrt(1 + nuf2))
    Nfpow = Nf

    /* Precalculate tf */
    tf = Math.tan(phif)
    tf2 = tf * tf
    tf4 = tf2 * tf2

    /* Precalculate fractional coefficients for x**n in the equations
     below to simplify the expressions for latitude and longitude. */
    x1frac = 1.0 / (Nfpow * cf)

    Nfpow *= Nf
    /* now equals Nf**2) */
    x2frac = tf / (2.0 * Nfpow)

    Nfpow *= Nf
    /* now equals Nf**3) */
    x3frac = 1.0 / (6.0 * Nfpow * cf)

    Nfpow *= Nf
    /* now equals Nf**4) */
    x4frac = tf / (24.0 * Nfpow)

    Nfpow *= Nf
    /* now equals Nf**5) */
    x5frac = 1.0 / (120.0 * Nfpow * cf)

    Nfpow *= Nf
    /* now equals Nf**6) */
    x6frac = tf / (720.0 * Nfpow)

    Nfpow *= Nf
    /* now equals Nf**7) */
    x7frac = 1.0 / (5040.0 * Nfpow * cf)

    Nfpow *= Nf
    /* now equals Nf**8) */
    x8frac = tf / (40320.0 * Nfpow)

    /* Precalculate polynomial coefficients for x**n.
     -- x**1 does not have a polynomial coefficient. */
    x2poly = -1.0 - nuf2

    x3poly = -1.0 - 2 * tf2 - nuf2

    x4poly = 5.0 + 3.0 * tf2 + 6.0 * nuf2 - 6.0 * tf2 * nuf2
      - 3.0 * (nuf2 * nuf2) - 9.0 * tf2 * (nuf2 * nuf2)

    x5poly = 5.0 + 28.0 * tf2 + 24.0 * tf4 + 6.0 * nuf2 + 8.0 * tf2 * nuf2

    x6poly = -61.0 - 90.0 * tf2 - 45.0 * tf4 - 107.0 * nuf2
      + 162.0 * tf2 * nuf2

    x7poly = -61.0 - 662.0 * tf2 - 1320.0 * tf4 - 720.0 * (tf4 * tf2)

    x8poly = 1385.0 + 3633.0 * tf2 + 4095.0 * tf4 + 1575 * (tf4 * tf2)

    /* Calculate latitude */
    latitudeDecimal = rad2deg(phif
      + x2frac * x2poly * (x * x)
      + x4frac * x4poly * Math.pow(x, 4.0)
      + x6frac * x6poly * Math.pow(x, 6.0)
      + x8frac * x8poly * Math.pow(x, 8.0))

    /* Calculate longitude */
    longitudeDecimal = rad2deg(centralMeridian
      + x1frac * x
      + x3frac * x3poly * Math.pow(x, 3.0)
      + x5frac * x5poly * Math.pow(x, 5.0)
      + x7frac * x7poly * Math.pow(x, 7.0))

    return Coordinate.fromDecimal(latitudeDecimal, longitudeDecimal)
  }

  /**
   * Attempts to parse a string of any format into a Coordinate object
   *
   * @param {string} input
   * @returns {Coordinate}
   */
  static parseAny(input: string) {
    input = input.toUpperCase().replace(/[^A-Z0-9.,\- ]+/g, '')
    if (Coordinate.stringIsDms(input)) { return Coordinate.parseDms(input) }
    if (Coordinate.stringIsMgrs(input)) { return Coordinate.parseMgrs(input) }
    if (Coordinate.stringIsUtm(input)) { return Coordinate.parseUtm(input) }
    if (Coordinate.stringIsDecimal(input)) { return Coordinate.parseDecimal(input) }
    throw new Error('Invalid coordinate format: ' + input)
  }

  /**
   * Parse a decimal-formatted string into a Coordinate
   *
   * @param {string} input  Example: "30.123, 30.456"
   * @returns {Coordinate}
   */
  static parseDecimal(input: string) {
    const [latitude, longitude] = input.split(',')
    return Coordinate.fromDecimal(parseFloat(latitude), parseFloat(longitude))
  }

  /**
   * Parse a DMS-formatted string into a Coordinate object
   *
   * @param {string} input  Example: "300000N0300000E" or "N300000 E0300000"
   * @returns {Coordinate}
   */
  static parseDms(input: string) {
    let latitudeHemisphere,
        latitudeHours,
        latitudeMinutes,
        latitudeSeconds,
        longitudeHemisphere,
        longitudeHours,
        longitudeMinutes,
        longitudeSeconds,
        chunks

    // Normalize the input string
    input = input.replace(/\W+/g, '').toUpperCase()

    // Get the values from both post and prefixed hemispheres
    if ((chunks = input.match(DMS_POSTFIX))) {
      latitudeHours = parseFloat(chunks[1])
      latitudeMinutes = parseFloat(chunks[2])
      latitudeSeconds = parseFloat(chunks[3])
      latitudeHemisphere = chunks[4]
      longitudeHours = parseFloat(chunks[5])
      longitudeMinutes = parseFloat(chunks[6])
      longitudeSeconds = parseFloat(chunks[7])
      longitudeHemisphere = chunks[8]
    }
    else if ((chunks = input.match(DMS_PREFIX))) {
      // Less common but equally valid(?)
      latitudeHemisphere = chunks[1]
      latitudeHours = parseFloat(chunks[2])
      latitudeMinutes = parseFloat(chunks[3])
      latitudeSeconds = parseFloat(chunks[4])
      longitudeHemisphere = chunks[5]
      longitudeHours = parseFloat(chunks[6])
      longitudeMinutes = parseFloat(chunks[7])
      longitudeSeconds = parseFloat(chunks[8])
    }
    else {
      throw new Error('Could not parse as DMS: ' + input)
    }

    return Coordinate.fromDms(
      latitudeHemisphere, latitudeHours, latitudeMinutes, latitudeSeconds,
      longitudeHemisphere, longitudeHours, longitudeMinutes, longitudeSeconds)
  }

  /**
   * Parse an MGRS-formatted string into a Coordinate object
   *
   * @param {string} input  Example: "30QDB00000000" or "30QDB 00000000"
   * @returns {Coordinate}
   */
  static parseMgrs(input: string) {
    const [zone, latitudeBand, column, row, location] = input.match(MGRS)!.slice(1, 7)

    // Validate the inputs
    if (location.length % 2 === 0) {
      const easting = parseInt(location.substring(0, location.length / 2))
      const northing = parseInt(location.substring(location.length / 2))

      return Coordinate.fromMgrs(parseInt(zone), latitudeBand, column, row, easting, northing)
    }
    throw new Error('Invalid MGRS: location must contain even number of digits')
  }

  /**
   * Parse a UTM-formatted string into a Coordinate object
   *
   * @param {string} input  Example: "30T 00000,000000" or "30T 00000 000000" or "00000, 000000 30T"
   * @returns {Coordinate}
   */
  static parseUtm(input: string) {
    let chunks,
        zone,
        hemisphere,
        easting,
        northing

    // Parse and normalize the input segments
    chunks = input.match(UTM_SPACE_PREFIX)
      || input.match(UTM_COMMA_PREFIX)
      || input.match(UTM_SPACE_POSTFIX)
      || input.match(UTM_COMMA_POSTFIX)
    chunks = chunks!.slice(1, 5)

    if (chunks[0].match(/\d+/) && chunks[1].match(/[NS]/i)) {
      // PREFIXED HEMISPHERE
      zone = parseInt(chunks[0])
      hemisphere = chunks[1]
      easting = parseInt(chunks[2])
      northing = parseInt(chunks[3])
    } else {
      // POSTFIXED HEMISPHERE
      easting = parseInt(chunks[0])
      northing = parseInt(chunks[1])
      zone = parseInt(chunks[2])
      hemisphere = chunks[3]
    }

    return Coordinate.fromUtm(zone, hemisphere, easting, northing)
  }

  /**
   * Tests if a given string is decimal-formatted
   *
   * @param {string} input
   * @returns {boolean}
   */
  static stringIsDecimal(input: string) {
    return DECIMAL.test(input)
  }

  /**
   * Tests if a given string is DMS-formatted
   *
   * @param {string} input
   * @returns {boolean}
   */
  static stringIsDms(input: string) {
    return DMS_POSTFIX.test(input)
      || DMS_PREFIX.test(input)
  }

  /**
   * Tests if a given string is DMS-formatted
   *
   * @param {string} input
   * @returns {boolean}
   */
  static stringIsMgrs(input: string) {
    return MGRS.test(input)
  }

  /**
   * Tests if a given string is UTM-formatted
   *
   * @param {string} input
   * @returns {boolean}
   */
  static stringIsUtm(input: string) {
    return UTM_SPACE_PREFIX.test(input)
      || UTM_COMMA_PREFIX.test(input)
      || UTM_SPACE_POSTFIX.test(input)
      || UTM_COMMA_POSTFIX.test(input)
  }
}
