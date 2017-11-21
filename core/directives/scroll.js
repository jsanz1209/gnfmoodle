/**
 * Course Fab Scroll directive.
 *
 * Its function is to capture the scroll event and hide a component when the scroll is in position 0
 *
 * @module mm.core.course
 * @ngdoc directive
 * @name fabScroll
 * @param button-fab. Element to hide / show
 * @description
 *
* Its function is to capture the scroll event and hide a component when the scroll is in position 0
 *
 * @example
 *
 * <ion-content fab-scroll button-fab="arrowUp"> </ion-content>
 */

angular.module('mm.core')

.directive('fabScroll', ['$window', ScrollDirective]);

function ScrollDirective($window) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var $p = angular.element(element);
            var idButton = attrs.buttonFab;
            var button = document.getElementById(idButton);
            var $e = angular.element(button);
            var last_position = 0;
            var onScroll = function(e) {
            
                var scrollTop = null;
                if(e.detail){
                   scrollTop = e.detail.scrollTop;
                }else if(e.target){
                   scrollTop = e.target.scrollTop;
                }

                if (scrollTop > 120) {
                    $e.removeClass('hidecustom');
                } else {
                    $e.addClass('hidecustom');
                }
            };

            $p.on('scroll', onScroll);
            $p.on('$destroy', function() {
                $p.off('scroll', onScroll);
            });
        }
    }
}

