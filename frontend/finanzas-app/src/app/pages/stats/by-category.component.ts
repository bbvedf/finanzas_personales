import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../core/services/stats.service';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

@Component({
    selector: 'app-by-category',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './by-category.component.html',
    styleUrls: ['./by-category.component.scss']
})
export class ByCategoryComponent implements OnInit {
    chartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ label: 'Total por categoría', data: [] }]
    };
    chartOptions: ChartOptions<'bar'> = { responsive: true };
    chartType: 'bar' = 'bar';

    constructor(private statsService: StatsService) { }

    ngOnInit(): void {
        this.statsService.getByCategory().subscribe(data => {
            console.log('bycategory data', data);
            this.chartData = {
                labels: data.map(d => d.category_name),
                datasets: [
                    {
                        label: 'Total por categoría',
                        data: data.map(d => d.total)
                    }
                ]
            };
        });
    }
}


