$(document).ready(function() {
	//вынесем параметр времени последней анимации в глобальную переменную, так как в противном случае при повторном запросе (например, при быстром переключении фильтров) не будет учитываться то, закончилась ли предыдущая анимация или нет.
	var last_animation_time = 0;

	//расширяем набор передаваемых значений в функцию, на случай, если потребуется отключить анимацию для определенных событий
	//(например подгрузка результатов скроллом)
	mSearch2.load = function (params, callback, animation) {
		if (!params || !Object.keys(params).length) {
			params = this.getFilters();
		}
		params.action = 'filter';
		params.pageId = mse2Config.pageId;
		if (mse2Config.page > 0) {params.page = mse2Config.page;}

		this.beforeLoad();
		params.key = mse2Config.key;
		
		//по-умолчанию анимация всегда будет срабатывать, если ее не запретить
		var effects = '';

		if (animation == 'no-animation') {
			//теперь для отключения анимации достаточно передать в функцию mSearch2.load третий параметр 'no-animation'
			effects = 'no-animation';
		}
		else {
			last_animation_time = $.now();
			//если название ваших классов отличается от приведенных выше, то здесь их необходимо заменить
			$(this.options['results']).removeClass('fade-out').addClass('fade-in');
		}
		
		$.post(mse2Config.actionUrl, params, function(response) {
			mSearch2.afterLoad();		

			if (response.success) {
				mSearch2.Message.success(response.message);
				mSearch2.pagination.html(response.data['pagination']);

				//В моем случае анимация появления/скрытия отличаются друг от друга, поэтому необходимо накладывать последующий эффект только после окончания предыдущего для избежания "мельтешения".	

				//Мы, конечно, могли бы просто затормозить процесс добавления результатов на длину времени анимации, но в таком случае пользователю придется дольше ждать, если фильтры отработают быстрее самой анимации. Так что считаем разницу:
				var animation_delay = 0;
				if (effects != 'no-animation') {
					var animation_time_left;
					
					animation_time_left = $.now() - last_animation_time;
					//если время воспроизведения вашей анимации отличается, то здесь необходимо указать актуальное значение
					if (animation_time_left >= 500) {
						animation_delay = 0;
					}
					else {
						animation_delay = 500 - animation_time_left;
					}
				}
				
				setTimeout(function(){
					mSearch2.results.html(response.data['results']);
				
					if (effects != 'no-animation') {
						$(mSearch2.options['results']).addClass('fade-out').removeClass('fade-in');
					}
					
					//добавим запрет на переключение фильтров до момента завершения анимации появления
					setTimeout(function(){
						$(mSearch2.options.filters + ' .' + mSearch2.options.disabled_class).prop('disabled', false).removeClass(mSearch2.options.disabled_class);
					}, 500);
				}, animation_delay);
				
				mSearch2.setTotal(response.data.total);
				if (callback && $.isFunction(callback)) {
					callback.call(this, response, params);
				}
				mSearch2.setSuggestions(response.data.suggestions);
				mSearch2.setEmptyFieldsets();
				if (response.data.log) {
					$('.mFilterLog').html(response.data.log);
				}
				$(document).trigger('mse2_load', response);
			}
			else {
				mSearch2.Message.error(response.message);
			}
		}, 'json');
		
	};
	
	//Так как мы вынесли процесс обновления доступности фильтров в наш таймер, необходимо убрать аналогичный фукнционал из afterLoad (там же уберем и эффект полупрозрачности):
	
	mSearch2.beforeLoad = function() {
		$(this.options.pagination_link).addClass(this.options.active_class);
		this.filters.find('input, select').prop('disabled', true).addClass(this.options.disabled_class);
	};
	
	mSearch2.afterLoad = function() {

	};
});