$(() => {
  $('.section-switch').click((e) => {
    e.stopPropagation();
  });
  
  $('select').material_select();
});