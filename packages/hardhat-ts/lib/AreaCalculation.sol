// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { Trigonometry } from "../lib/Trigonometry.sol";


library AreaCalculation {
    // Multiplications exponents to avoid decimals
    int256 private constant RAD_EXP = 1e9; // Radians exponent
    int256 private constant SIN_EXP = 1e9; // Sine exponent
    int256 private constant COORD_EXP = 1e9; // Coordinates exponent
    int256 private constant PI_EXP = 1e9; // Pi exponent

    // Other constants
    int256 private constant PI = 3141592653;
    int256 private constant EARTH_RADIUS = 6371008; // m

    /**
     * @notice Calculate the area of a multi polygon coordinates
     * @param _coordinates Big Number integer coordinates of a multi polygon
     * @return Area measured in square meters
    */
    function multiPolygonArea(int256[2][][][] memory _coordinates) public pure returns (uint256) {
        uint256 total = 0;

        for (uint256 i = 0; i < _coordinates.length; i++) {
            total += polygonArea(_coordinates[i]);
        }

        return total;
    }

    /**
     * @notice Calculate the area of a single polygon coordinates
     * @param _coordinates Big Number integer coordinates of a single polygon - an array of rings
     * @return Area measured in square meters
    */
    function polygonArea (int256[2][][] memory _coordinates) public pure returns (uint256) {
        int256 total = 0;

        if (_coordinates.length > 0) {
            total += abs(ringArea(_coordinates[0]));

            for (uint256 i = 1; i < _coordinates.length; i++) {
                total -= abs(ringArea(_coordinates[i]));
            }
        }
        return uint256(total);
    }

    /**
     * @notice Calculate the area of a coordinates ring (a polygon single part).
        Obtained from Turf.js area function
        (https://github.com/Turfjs/turf/blob/master/packages/turf-area/index.ts)
     * @param _coordinates Big Number integer coordinates of a single polygon ring
     * @return Area measured in square meters
    */
    function ringArea(int256[2][] memory _coordinates) private pure returns (int256) {
        bool isValidPolygon = isPolygon(_coordinates);
        require(isValidPolygon == true, "The coordinates are invalid");

        uint256 coordsLength = _coordinates.length;
        int256[2] memory p1;
        int256[2] memory p2;
        int256[2] memory p3;
        uint256 lowerIndex;
        uint256 middleIndex;
        uint256 upperIndex;
        int256 total = 0;

        if (coordsLength > 2) {
            for (uint256 i = 0; i < coordsLength; i++) {
                if (i == coordsLength - 2) {
                    // i = N-2
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength - 1;
                    upperIndex = 0;
                } else if (i == coordsLength - 1) {
                    // i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else {
                    // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i + 1;
                    upperIndex = i + 2;
                }
                p1 = _coordinates[lowerIndex];
                p2 = _coordinates[middleIndex];
                p3 = _coordinates[upperIndex];

                int256 v1 = nanoRad(p3[0]);
                int256 v2 = nanoRad(p1[0]);
                int256 v3 = nanoSin(p2[1]);

                int256 subTotal = (v1 - v2) * v3;
                total += subTotal;
            }

            // Must divide by all exponents applied before
            total = total * EARTH_RADIUS**2 / (2 * RAD_EXP * SIN_EXP * PI_EXP * COORD_EXP);
        }
        return total;
    }

    /**
     * @notice Calculate nano radians (radians * 10^9) of a certain degree angle.
     * @param _angle Degree angle (0-360º)
     * @return Nano radians
    */
    function nanoRad(int256 _angle) private pure returns (int256) {
        return (_angle * PI * RAD_EXP) / (180);
    }

    /**
     * @notice Calculate nano sine (sine * 10^9) of a certain degree angle.
        The sine of an angle is given in a range [-1, 1]. The argument of the sine function 
        is usually radians, which exists in a range [0, 2π rad]. Since this is not possible in 
        Solidity, the following function returns the angle in 'nano' units (sine * 10^9). To do 
        so, the sine is calculated using integer values. Instead of using a circle divided 
        in 360 angle units (degrees), it assumes a circle divided in 1073741824 angle units (tAngle).
        To convert from degrees to tAngle units we need to do the following:
            tAngle = (degrees * 1073741824) / 360;
        The returning value exists on a range [-2147483647, 2147483647] (signed 32-bit). Therefore, to 
        finally get the sine value, we need to divide the sin() function by 2147483647;
     * @param _angle Degree angle (0-360º)
     * @return Nano sine
    */
    function nanoSin(int256 _angle) private pure returns (int256) {
        int256 angleUnits = 1073741824;
        int256 maxAngle = 2147483647;
        int256 tAngle = (_angle * angleUnits) / (360 * COORD_EXP);
        return Trigonometry.sin(uint256(tAngle)) * int(SIN_EXP) / maxAngle;
    }

    /**
     * @notice Returns the absolute value of the input
     * @param _value Input integer value
     * @return Absolute input value
    */
    function abs(int256 _value) private pure returns (int256) {
        return _value >= 0
            ? _value
            : -_value;
    }

    /**
     * @notice Checks to make sure first and last coordinates are the same
     * @param _coordinates Polygon ring
     * @return Boolean whether the coordinates represents a closed polygon or not
    */
    function isPolygon (int256[2][] memory _coordinates) public pure returns (bool) {
        uint256 length = _coordinates.length;
        if (length > 2) {
            // Coordinates of first coordinate of polygon
            int256 firstLat = _coordinates[0][0];
            int256 firstLon = _coordinates[0][1];
            // Coordinates of last coordinate of polygon
            int256 lastLat = _coordinates[length - 1][0];
            int256 lastLon = _coordinates[length - 1][1];

            return (firstLat == lastLat && firstLon == lastLon);
        }

        return false;
    }
}