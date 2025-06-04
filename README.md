# Combine Groups

Combine Groups is a small web tool for merging summary statistics from multiple groups.  
Provide the number of samples and mean for each group along with any of the following dispersion measures:

- Standard Deviation (SD)
- Standard Error (SE)
- Confidence Interval (CI)
- Range
- Interquartile Range (IQR)

The app computes a combined sample size, mean and standard deviation for all groups.  It also draws normal distribution curves for each individual group and the combined group using Plotly.

## Getting Started

Open `index.html` in a modern browser.  No build step or server is required.

1. Enter rows for each group using the **Add row** button.
2. For each row, fill in the sample size (**n**), the mean, choose the dispersion type and supply its value(s).
3. The SD column will show the calculated standard deviation for each group.
4. Once at least two valid rows are entered, the **Combined Result** section displays the overall statistics and plots.

## Files

- **index.html** – page markup and Plotly script inclusion
- **script.js** – UI logic, calculations and chart drawing
- **style.css** – dark themed styles

## License

This project is licensed under the MIT License.
