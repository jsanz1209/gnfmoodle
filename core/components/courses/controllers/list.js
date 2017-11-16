// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core.courses')

/**
 * Controller to handle the courses list.
 *
 * @module mm.core.courses
 * @ngdoc controller
 * @name mmCoursesListCtrl
 */

.constant("MAX_WIDTH_SCREEN", 600)

.controller('mmCoursesListCtrl', function($scope, $mmCourses, $mmCoursesDelegate, $mmUtil, $mmEvents, $mmSite, $q, $mmApp, $ionicPlatform, $mdSelect, $timeout, $filter,
            mmCoursesEventMyCoursesUpdated, mmCoreEventSiteUpdated, MAX_WIDTH_SCREEN) {

    var updateSiteObserver,
        myCoursesObserver, 
        selectedStatus, 
        selectedCategory,
        pressButtonSelectStatus,
        itemsStatusSelected,
        pressButtonSelectCategory,
        itemsCategorySelected;

    $scope.searchEnabled = $mmCourses.isSearchCoursesAvailable() && !$mmCourses.isSearchCoursesDisabledInSite();
    $scope.filter = {};

    // Convenience function to fetch courses.
    function fetchCourses(refresh) {
        return $mmCourses.getUserCourses().then(function(courses) {
            $scope.filter.filterText = ''; // Filter value MUST be set after courses are shown.

            var courseIds = courses.map(function(course) {
                return course.id;
            });

            return $mmCourses.getCoursesOptions(courseIds).then(function(options) {
                angular.forEach(courses, function(course) {
                    course.progress = isNaN(parseInt(course.progress, 10)) ? false : parseInt(course.progress, 10);
                    course.navOptions = options.navOptions[course.id];
                    course.admOptions = options.admOptions[course.id];
                });
                $scope.courses = courses;
                //Load filters and sorts
                loadFilters(courses);
                loadSorts();
            });
        }, function(error) {
            $mmUtil.showErrorModalDefault(error, 'mm.courses.errorloadcourses', true);
        });
    }


    //Initial load filters
    function loadFilters(courses)  {

        $scope.isVisibleSort = false;
        $scope.isVisibleFilter = false;

        $scope.status = [];
        $scope.categories = [];

        $scope.selectedStatus = [];
        $scope.selectedCategory = [];

        angular.forEach(courses, function(course) {
            
            var status_trad = course.state_trad;
            var catname = course.catname;

            //Buscamos si el status ya existe en el checkbox, si no lo añadimos
            var findStatus = $scope.status.find(function(item) {
                return item.name == status_trad;
            })

            if (typeof findStatus === 'undefined') {
                $scope.status.push({
                    category:  $filter("translate")("mm.courses.status"), 
                    name: status_trad
                });
            }

            //Buscamos si el contextoya existe en el checkbox, si no lo añadimos
            var findCategory = $scope.categories.find(function(item) {
                return item.name == catname;
            })

            if (typeof findCategory === 'undefined') {
                $scope.categories.push({
                    category: $filter("translate")("mm.courses.category"), 
                    name: catname
                });
            }
          
        });
    }

    //Initial load sorts
    function loadSorts() {

        $scope.orderSelect = {
            orderByParam: ""
        }

        $scope.optionSortCatname = {
            isOpen: false,
            count: 0,
            selectedDirection: 'right',
            optionSel: '',
            selectOrderCatnameCriterion: ''
        };

        //Informs about the screen is large or not 
        $scope.isLargeScreen =  window.screen.width >= MAX_WIDTH_SCREEN;
        $scope.layout = window.screen.width >= MAX_WIDTH_SCREEN ? "row" : "column";

        $scope.optionSortStatus = {
            isOpen: false,
            count: 0,
            selectedDirection:  window.screen.width >= MAX_WIDTH_SCREEN ? 'left' : 'right',
            optionSel: '',
            selectOrderStatusCriterion: ''
        };
       
        $mmCourses.resetColorFabToolbar();
    }



    fetchCourses().finally(function() {
        $scope.coursesLoaded = true;
    });

    $scope.refreshCourses = function() {
        var promises = [];

        promises.push($mmCourses.invalidateUserCourses());
        promises.push($mmCoursesDelegate.clearAndInvalidateCoursesOptions());

        $q.all(promises).finally(function() {

            fetchCourses(true).finally(function() {
                $scope.$broadcast('scroll.refreshComplete');
            });
        });
    };

    //Filter by name
    $scope.filterName = function(course) {
        var filterName = $scope.filter.filterText.toLowerCase();
        return course.name.toLowerCase().indexOf(filterName) != -1 || course.path.toLowerCase().indexOf(filterName) != -1;
    }


    //Filter by status (state_trad)
    $scope.filterStatus = function(course) {
        var filterStatus = $scope.selectedStatus;
        if (filterStatus.length > 0) {
            return filterStatus.indexOf(course.state_trad) != -1;
        }

        return true;
    }

    //Filter by category (catname)
    $scope.filterCategory = function(course) {
        if($scope.selectedCategory.length > 0) {
            return $scope.selectedCategory.indexOf(course.catname) != -1;
        }
        return true;
    }


    //Event trigger when we select somo check box option in status filter select
    $scope.onChangeStatusFilter = function(selectedStatus) {
       self.selectedStatus = selectedStatus;        
    }

    //Event trigger when we select somo check box option in category filter select
    $scope.onChangeCategoryFilter = function(selectedCategory) {
        self.selectedCategory = selectedCategory;
    }


    myCoursesObserver = $mmEvents.on(mmCoursesEventMyCoursesUpdated, function(siteid) {
        if (siteid == $mmSite.getId()) {
            fetchCourses();
        }
    });


    updateSiteObserver = $mmEvents.on(mmCoreEventSiteUpdated, function(siteId) {
        if ($mmSite.getId() === siteId) {
            $scope.searchEnabled = $mmCourses.isSearchCoursesAvailable() && !$mmCourses.isSearchCoursesDisabledInSite();
        }
    });

    $scope.$on('$destroy', function() {
        myCoursesObserver && myCoursesObserver.off && myCoursesObserver.off();
        updateSiteObserver && updateSiteObserver.off && updateSiteObserver.off();
    });


    //Get icon selected in sort options
    $scope.getIconSelected = function(optionSort) {
        var pathIcon = "img/custom/sort" + optionSort.optionSel + ".svg";
        return pathIcon;
    }


    //Change value of name sort
    $scope.changeValueSortCatname = function(value, $event) {
        
        $event.preventDefault();
        $event.stopPropagation();
        $event.stopImmediatePropagation();

        $mmCourses.resetColorFabToolbar();
        
        $scope.optionSortStatus.optionSel = '';
        $scope.optionSortStatus.selectOrderStatusCriterion = "";
        
        if ($scope.optionSortCatname.optionSel == value) {
            $scope.optionSortCatname.optionSel = '';        
            $scope.optionSortCatname.selectOrderCatnameCriterion = "";
            $scope.orderSelect.orderByParam = "";
        } else {
            $scope.optionSortCatname.optionSel = value;
            switch(value) {
                case "asc": 
                    $scope.optionSortCatname.selectOrderCatnameCriterion =  $filter("translate")("mm.courses.ascending");
                    $scope.orderSelect.orderByParam = "catname";
                    break;

                case "desc": 
                    $scope.optionSortCatname.selectOrderCatnameCriterion = $filter("translate")("mm.courses.descending");
                    $scope.orderSelect.orderByParam = "-catname";
                    break;

                default:
            }
        }
    }

    //Change value of status sort
    $scope.changeValueSortStatus = function(value, $event) {
        
        $event.preventDefault();
        $event.stopPropagation();
        $event.stopImmediatePropagation();

        $mmCourses.resetColorFabToolbar();
        
        $scope.optionSortCatname.optionSel = '';
        $scope.optionSortCatname.selectOrderCatnameCriterion = "";
        
        if ($scope.optionSortStatus.optionSel == value) {
            $scope.optionSortStatus.optionSel = '';        
            $scope.optionSortStatus.selectOrderStatusCriterion = "";
            $scope.orderSelect.orderByParam = "";
        } else {
            $scope.optionSortStatus.optionSel = value;
            switch(value) {
                case "status": 
                    $scope.optionSortStatus.selectOrderStatusCriterion = $filter("translate")("mm.courses.statusAsc");
                    $scope.orderSelect.orderByParam = "state_trad";
                    break;

                case "statusinverse": 
                    $scope.optionSortStatus.selectOrderStatusCriterion = $filter("translate")("mm.courses.statusDesc");
                    $scope.orderSelect.orderByParam = "-state_trad";
                    break;

                default:
            }
        }
    }

    //Press accept button on status sort
    $scope.acceptFilterStatus = function() {
        self.pressButtonSelectStatus = "accept";
        $scope.selectedStatus = self.selectedStatus;
        $mdSelect.hide();
    }

    //Press cancel button on status sort
    $scope.cancelFilterStatus = function() {
        self.pressButtonSelectStatus = "cancel";
        $mdSelect.hide();
    }

    //Event trigger when select status is closed
    $scope.onCloseSelectStatus = function(selectedStatus) {
        //We haven't tap on accept button
        if(self.pressButtonSelectStatus != "accept") {
            //Clean selected status array
            selectedStatus.splice(0, selectedStatus.length);
            //Add last thet last confirmed items
            angular.forEach(self.itemsStatusSelected, function(item) {
                selectedStatus.push(item);
            });

            //Lose focus of the element
            $timeout(function() {
                document.getElementById("selectStatus").blur();
            }, 500);
        }   

        if(selectedStatus.length == 0) {
            //Lose focus of the element
            $timeout(function() {
                document.getElementById("selectStatus").blur();
            }, 500);
        }     
    }

    //Event trigger when select status is opened
    $scope.onOpenSelectStatus = function() {
        self.pressButtonSelectStatus = "";
        self.itemsStatusSelected = angular.copy($scope.selectedStatus);
    }


    //Press accept button on category sort
    $scope.acceptFilterCategory = function() {
        self.pressButtonSelectCategory = "accept";
        $scope.selectedCategory = self.selectedCategory;
        $mdSelect.hide();
    }

    //Press cancel button on category sort
    $scope.cancelFilterCategory = function() {
        self.pressButtonSelectCategory = "cancel";
        $mdSelect.hide();
    }

    //Event trigger when select category is closed
    $scope.onCloseSelectCategory = function(selectedCategory) {
        //We haven't tap on accept button
        if(self.pressButtonSelectCategory != "accept") {
            //Clean selected category array
            selectedCategory.splice(0, selectedCategory.length);
            //Add last thet last confirmed items
            angular.forEach(self.itemsCategorySelected, function(item) {
                selectedCategory.push(item);
            });

            //Lose focus of the element
            $timeout(function() {
                document.getElementById("selectCategory").blur();
            }, 500);
        }

        if(selectedCategory.length == 0) {
            //Lose focus of the element
            $timeout(function() {
                document.getElementById("selectCategory").blur();
            }, 500);
        } 
    }

    //Event trigger when select status is opened
    $scope.onOpenSelectCategory = function() {
        self.pressButtonSelectCategory = "";
        self.itemsCategorySelected = angular.copy($scope.selectedCategory);
    }


    //Check if some filter is applied
    $scope.checkVisibilityFilters = function() {
        if((angular.isDefined($scope.selectedStatus) && $scope.selectedStatus.length > 0)
            || (angular.isDefined($scope.selectedCategory) && $scope.selectedCategory.length > 0)
            || $scope.optionSortStatus.optionSel != ''
            || $scope.optionSortCatname.optionSel != ''
            || $scope.filter.filterText.length > 0 ) {
            return true;
        }

        return false;
    }

    //Delete all applied filters
    $scope.clearFilters = function(selectedStatus, selectedCategory) {
        $timeout(function() {
            //Clean filters
            selectedCategory.splice(0, selectedCategory.length);
            selectedStatus.splice(0, selectedStatus.length);
            document.getElementById("selectStatus").blur();
            document.getElementById("selectCategory").blur();
            //Clean sorts
            loadSorts();
            //Clean search text
            $scope.filter.filterText = ''           
        }, 500);
    }



    window.addEventListener("orientationchange", function() {
        var auxOptionSortStatus = angular.copy($scope.optionSortStatus);
        $scope.isLargeScreen = window.screen.width >= MAX_WIDTH_SCREEN;
        $scope.layout = window.screen.width >= MAX_WIDTH_SCREEN ? "row" : "column";
        $scope.optionSortStatus.selectedDirection = $scope.isLargeScreen ? 'left' : 'right';
        if($scope.optionSortStatus.optionSel != '') {
            $mmCourses.setColorFabToolbarOptionSelected();
        }
    });

});
