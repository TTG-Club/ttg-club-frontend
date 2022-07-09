package club.dnd5.portal.repository.classes;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import club.dnd5.portal.model.book.Book;
import club.dnd5.portal.model.book.TypeBook;
import club.dnd5.portal.model.classes.HeroClass;

@Repository
public abstract interface ClassRepository extends JpaRepository<HeroClass, Integer>, JpaSpecificationExecutor<HeroClass> {
	@Query("select h from HeroClass h inner join h.spells s where s.name = :spellName")
	List<HeroClass> findBySpellName(@Param("spellName") String paramString);

	HeroClass findByEnglishName(String name);

	@Query("SELECT c FROM HeroClass c WHERE c.book.type IN :types")
	List<HeroClass> findAllBySources(@Param("types") Iterable<TypeBook> types);
	
	Collection<HeroClass> findAllBySidekick(boolean sidekick);
	
	@Query("SELECT c.book FROM HeroClass c GROUP BY c.book HAVING c.book.type = :type ORDER BY c.book.year")
	List<Book> findBook(@Param("type") TypeBook type);
}