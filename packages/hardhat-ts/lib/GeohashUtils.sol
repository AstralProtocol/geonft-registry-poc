// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// import console.log
import "hardhat/console.sol";

library GeohashUtils {
    // length of the geohash string
    uint256 private constant COORD_EXP = 1e9; // Coordinates exponent to avoid decimals
    int64 private constant MIN_LAT = -90 * int64(int256(COORD_EXP));
    int64 private constant MAX_LAT = 90 * int64(int256(COORD_EXP));
    int64 private constant MIN_LON = -180 * int64(int256(COORD_EXP));
    int64 private constant MAX_LON = 180 * int64(int256(COORD_EXP));
    string private constant GEOHASH_CODES = "0123456789bcdefghjkmnpqrstuvwxyz"; // Codes for geohash encoding
    bytes private constant CODES_BYTES = bytes(GEOHASH_CODES); // Codes in bytes format to iterate as array

    struct Node {
        uint256[] data;
    }

    /**
     * @notice Encode point into geohash (more of geohash: https://en.wikipedia.org/wiki/Geohash).
     *     Obtained from the node geohash package (ngeohash): https://github.com/sunng87/node-geohash
     * @param _lat latitude
     * @param _lon longitude
     * @param _precision geohash length precision
     * @return Geohash string with the same length as the _precision value (1-9)
     */
    function encode(
        int64 _lat,
        int64 _lon,
        uint8 _precision
    ) public pure returns (string memory) {
        bytes memory hashBytes = new bytes(_precision);
        int8 bits = 0;
        int8 bitsTotal = 0;
        int8 hashValue = 0;
        int64 maxLat = MAX_LAT;
        int64 minLat = MIN_LAT;
        int64 maxLon = MAX_LON;
        int64 minLon = MIN_LON;
        int64 mid;
        uint8 counter;

        while (counter < _precision) {
            if (bitsTotal % 2 == 0) {
                mid = (maxLon + minLon) / 2;

                if (_lon > mid) {
                    hashValue = (hashValue << 1) + 1;
                    minLon = mid;
                } else {
                    hashValue = (hashValue << 1) + 0;
                    maxLon = mid;
                }
            } else {
                mid = (maxLat + minLat) / 2;

                if (_lat > mid) {
                    hashValue = (hashValue << 1) + 1;
                    minLat = mid;
                } else {
                    hashValue = (hashValue << 1) + 0;
                    maxLat = mid;
                }
            }

            bits++;
            bitsTotal++;

            if (bits == 5) {
                bytes1 charByte = CODES_BYTES[uint8(hashValue)];
                hashBytes[counter] = charByte;
                bits = 0;
                hashValue = 0;
                counter++;
            }
        }

        return string(hashBytes);
    }

    /**
     * @notice Decode a geohash of any given length to a pair of coordinates
     *     Obtained from the node geohash package (ngeohash): https://github.com/sunng87/node-geohash
     * @param _geohash Geohash string up to 9 characters of precision
     * @return Array of Big Number integer coordinates (lat, lon)
     */
    function decode(string memory _geohash)
        public
        pure
        returns (int64[2] memory)
    {
        int64[4] memory bbox = decodeBbox(_geohash);
        int64 minLat = bbox[0];
        int64 minLon = bbox[1];
        int64 maxLat = bbox[2];
        int64 maxLon = bbox[3];
        // Get center value of bounding box
        int64 lat = (minLat + maxLat) / 2; // Latitude middle point
        int64 lon = (minLon + maxLon) / 2; // Longitude middle point

        return [lat, lon];
    }

    /**
     * @notice Decode the bounding box of a given geohash
     *     Obtained from the node geohash package (ngeohash): https://github.com/sunng87/node-geohash
     * @param _geohash Geohash string up to 9 characters of precision
     * @return Array of Big Number integer coordinates representing the 
        bounding box (lower left point, upper right point)
     */
    function decodeBbox(string memory _geohash)
        private
        pure
        returns (int64[4] memory)
    {
        bool isLon = true;
        int64 maxLat = MAX_LAT;
        int64 minLat = MIN_LAT;
        int64 maxLon = MAX_LON;
        int64 minLon = MIN_LON;
        int64 mid;
        uint8 hashValue;

        for (uint8 i = 0; i < bytes(_geohash).length; i++) {
            string memory code = string(abi.encodePacked(bytes(_geohash)[i]));
            hashValue = uint8(indexOf(GEOHASH_CODES, code));
            require(hashValue >= 0);

            for (uint8 bits = 5; bits > 0; bits--) {
                uint8 bit = (hashValue >> (bits - 1)) & 1;

                if (isLon) {
                    mid = (maxLon + minLon) / 2;

                    bit == 1
                        ? minLon = mid
                        : maxLon = mid;
                } else {
                    mid = (maxLat + minLat) / 2;

                    bit == 1
                        ? minLat = mid
                        : maxLat = mid;
                }
                
                isLon = !isLon;
            }
        }
        return [minLat, minLon, maxLat, maxLon];
    }

    function indexOf(string memory _string, string memory _char)
        internal
        pure
        returns (int8) 
    {
        bytes memory _baseBytes = bytes(_string);
        bytes memory _valueBytes = bytes(_char);

        assert(_valueBytes.length == 1);

        for (uint8 i = 0; i < _baseBytes.length; i++) {
            if (_baseBytes[i] == _valueBytes[0]) {
                return int8(i);
            }
        }

        return -1;
    }
}
