import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../core/services/stats.service';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { ThemeService } from '../../core/services/theme.service';

@Component({
    selector: 'app-by-user',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './by-user.component.html',
    styleUrls: ['./by-user.component.scss']
})
export class ByUserComponent implements OnInit {
    private _currentTheme: 'light' | 'dark' = 'light';
    get currentTheme() { return this._currentTheme; }

    chartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ label: 'Total por usuario', data: [], backgroundColor: [], borderColor: [] }]
    };

    chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: { legend: { labels: { color: '#000' } } },
        scales: {
            x: { ticks: { color: '#000' }, grid: { color: '#333' } },
            y: { ticks: { color: '#000' }, grid: { color: '#333' } }
        }
    };

    chartType: 'bar' = 'bar';

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

        // Cargar datos del gráfico
        this.statsService.getByUser().subscribe(data => {
            this.chartData = {
                labels: data.map(d => d.username),
                datasets: [
                    {
                        label: 'Total por usuario',
                        data: data.map(d => d.total),
                        backgroundColor: [],
                        borderColor: []
                    }
                ]
            };
            this.applyThemeColors();
        });
    }

    // Devuelve colores según el tema
    private getThemeColors(): { barColor: string, textColor: string, gridColor: string } {
        if (this.currentTheme === 'light') {
            return {
                barColor: '#ffa1b5',      // rosa
                textColor: '#909090',     // gris oscuro suave
                gridColor: '#909090'      // gris oscuro suave
            };
        } else { // dark
            return {
                barColor: '#4caf50',      // verde
                textColor: '#eeeeeec5',   // gris claro
                gridColor: '#eeeeeec5'    // gris claro
            };
        }
    }

    private applyThemeColors(): void {
        const { barColor, textColor, gridColor } = this.getThemeColors();

        // Barras
        this.chartData.datasets.forEach(ds => {
            ds.backgroundColor = barColor;
            ds.borderColor = barColor;
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
