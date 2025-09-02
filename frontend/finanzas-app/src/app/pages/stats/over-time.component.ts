import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../core/services/stats.service';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { ThemeService } from '../../core/services/theme.service';

@Component({
    selector: 'app-over-time',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './over-time.component.html',
    styleUrls: ['./over-time.component.scss']
})
export class OverTimeComponent implements OnInit {
    private _currentTheme: 'light' | 'dark' = 'light';
    get currentTheme() { return this._currentTheme; }

    chartData: ChartData<'line'> = {
        labels: [],
        datasets: [{ label: 'Total mensual', data: [], fill: false, borderColor: '' }]
    };

    chartOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: { legend: { labels: { color: '#000' } } },
        scales: {
            x: { ticks: { color: '#000' }, grid: { color: '#333' } },
            y: { ticks: { color: '#000' }, grid: { color: '#333' } }
        }
    };

    chartType: 'line' = 'line';

    constructor(
        private statsService: StatsService,        
        public themeService: ThemeService
    ) { }

    ngOnInit(): void {
        // Suscribirse al tema
        this.themeService.theme$.subscribe(theme => {
            if (theme === 'light' || theme === 'dark') {
                this._currentTheme = theme;
                this.applyThemeColors();
            }
        });

        // Datos del gráfico
        this.statsService.getOverTime().subscribe(data => {
            this.chartData = {
                labels: data.map(d => d.month),
                datasets: [
                    {
                        label: 'Total mensual',
                        data: data.map(d => d.total),
                        fill: false,
                        borderColor: '' // se definirá según el tema
                    }
                ]
            };
            this.applyThemeColors();
        });
    }

    private getThemeColors(): { lineColor: string, textColor: string, gridColor: string, pointColor: string, legendBoxColor: string } {
        if (this.currentTheme === 'light') {
            return {
                lineColor: '#ffa1b5',      // rosa
                textColor: '#909090',      // gris oscuro suave
                gridColor: '#909090',       // gris oscuro suave
                pointColor: '#ff1a75',       // rosa fuerte, siempre
                legendBoxColor: '#ffa1b5',      // rosa
            };
        } else { // dark
            return {
                lineColor: '#4caf50',      // verde
                textColor: '#eeeeeec5',    // gris claro
                gridColor: '#eeeeeec5',     // gris claro
                pointColor: '#7eb880ff',       // rosa fuerte, siempre
                legendBoxColor: '#4caf50',      // verde
            };
        }
    }

    private applyThemeColors(): void {
        const { lineColor, textColor, gridColor, pointColor, legendBoxColor } = this.getThemeColors();

        // Línea
        this.chartData.datasets.forEach(ds => {
            ds.borderColor = lineColor;
            ds.pointBackgroundColor = pointColor;
            ds.pointBorderColor = pointColor;
            ds.backgroundColor = legendBoxColor;
        });

        // Texto y ejes
        this.chartOptions = {
            ...this.chartOptions,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
        };
    }
}
