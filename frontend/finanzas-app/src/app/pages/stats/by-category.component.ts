import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../core/services/stats.service';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { ThemeService } from '../../core/services/theme.service';

@Component({
    selector: 'app-by-category',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './by-category.component.html',
    styleUrls: ['./by-category.component.scss']
})
export class ByCategoryComponent implements OnInit {
    private _currentTheme: 'light' | 'dark' = 'light';
    get currentTheme() { return this._currentTheme; }

    chartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ label: 'Total por categoría', data: [], backgroundColor: [], borderColor: [] }]
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
        public themeService: ThemeService,
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
        this.statsService.getByCategory().subscribe(data => {
            this.chartData = {
                labels: data.map(d => d.category_name),
                datasets: [
                    {
                        label: 'Total por categoría',
                        data: data.map(d => d.total),
                        backgroundColor: [],
                        borderColor: []
                    }
                ]
            };
            this.applyThemeColors();
        });
    }

    // Devuelve todos los colores relevantes según el tema, en un único if
    private getThemeColors(): { barColor: string, textColor: string, gridColor: string } {
        if (this.currentTheme === 'light') {
            return {
                barColor: '#ffa1b5',          // rosa
                textColor: '#909090',         // gris oscuro más suave
                gridColor: '#909090'          // gris oscuro más suave
            };
        } else { // dark
            return {
                barColor: '#4caf50',       // verde
                textColor: '#eeeeeec5',         // gris claro
                gridColor: '#eeeeeec5'          // gris claro
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
